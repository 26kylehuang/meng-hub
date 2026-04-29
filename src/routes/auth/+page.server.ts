import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session } }) => {
    if (session) throw redirect(303, '/');
    return {};
};

export const actions = {
    login: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const email    = (data.get('email') as string)?.trim();
        const password = data.get('password') as string;

        if (!email || !password) return fail(400, { error: 'Email and password are required.' });

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return fail(400, { error: error.message });

        throw redirect(303, '/');
    },

    register: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const email    = (data.get('email') as string)?.trim();
        const password = data.get('password') as string;
        const fullName = (data.get('fullName') as string)?.trim();

        if (!email || !password) return fail(400, { error: 'Email and password are required.' });
        if (password.length < 6) return fail(400, { error: 'Password must be at least 6 characters.' });

        const { data: authData, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: fullName } }
        });

        if (error) return fail(400, { error: error.message });

        if (authData.user && !authData.session) {
            return { message: 'Check your email to confirm your account before signing in.' };
        }

        throw redirect(303, '/tutorial');
    },

    logout: async ({ locals: { supabase } }) => {
        await supabase.auth.signOut();
        throw redirect(303, '/auth');
    }
};
