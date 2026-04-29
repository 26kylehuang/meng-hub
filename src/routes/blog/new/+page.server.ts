import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals: { session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole === 'student') throw redirect(303, '/');
    return {};
};

export const actions = {
    default: async ({ request, locals: { supabase, session, userRole } }) => {
        if (!session || userRole === 'student') return fail(403, { error: 'Unauthorized' });

        const data = await request.formData();
        const title    = (data.get('title')    as string)?.trim();
        const excerpt  = (data.get('excerpt')  as string)?.trim();
        const body     = (data.get('body')     as string)?.trim();
        const category = (data.get('category') as string) || 'Platform Update';
        const publish  = data.get('publish') === 'true';

        if (!title) return fail(400, { error: 'Title is required.' });

        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim().replace(/\s+/g, '-')
            + '-' + Date.now().toString(36);

        const { error } = await supabase.from('posts').insert({
            title, slug, excerpt, body, category,
            published: publish,
            published_at: publish ? new Date().toISOString() : null,
            author_id: session.user.id,
        });

        if (error) return fail(500, { error: error.message });
        throw redirect(303, '/blog');
    },
};
