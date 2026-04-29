import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createServerClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll: () => event.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        event.cookies.set(name, value, { ...options, path: '/' });
                    });
                }
            }
        }
    );

    const { data: { session } } = await event.locals.supabase.auth.getSession();
    event.locals.session = session;

    if (session) {
        const { data: profile } = await event.locals.supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        event.locals.userRole = profile?.role || 'student';
    } else {
        event.locals.userRole = null;
    }

    const path = event.url.pathname;

    if (path.startsWith('/admin') || path.startsWith('/review')) {
        if (!session) throw redirect(303, '/auth');
        if (event.locals.userRole !== 'admin') throw redirect(303, '/');
    }

    if (path.startsWith('/warren')) {
        if (!session) throw redirect(303, '/auth');
        if (event.locals.userRole === 'student') throw redirect(303, '/');
    }

    const protectedRoutes = ['/dashboard', '/progress', '/quiz', '/class', '/blog', '/forge', '/profile', '/review', '/warren', '/concepts'];
    if (protectedRoutes.some(r => path.startsWith(r))) {
        if (!session) throw redirect(303, '/auth');
    }

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        },
    });
};
