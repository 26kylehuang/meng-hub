import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole === 'student') throw redirect(303, '/');

    const { data: concepts } = await supabase
        .from('concepts')
        .select('id, title, content_json, created_at')
        .order('title', { ascending: true });

    return { concepts: concepts ?? [] };
};
