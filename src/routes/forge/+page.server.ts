import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session, userRole, supabase } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole === 'student') throw redirect(303, '/');

    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, units(title, classes(title))')
        .order('created_at', { ascending: false })
        .limit(100);

    const { data: concepts } = await supabase
        .from('concepts')
        .select('id, title')
        .order('title');

    return {
        lessons: lessons ?? [],
        concepts: concepts ?? [],
    };
};
