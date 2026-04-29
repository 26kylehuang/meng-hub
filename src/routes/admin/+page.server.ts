import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole !== 'admin') throw redirect(303, '/');

    const { data: feedback } = await supabase
        .from('user_feedback')
        .select(`
            id, issue_type, note, page_url, created_at, resolved,
            block_id,
            lesson_id,
            lessons(title, units(title, classes(title))),
            profiles(full_name, email)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

    const [
        { count: totalUsers },
        { count: totalBlocks },
        { count: draftBlocks },
        { count: pendingReview },
        { count: totalQuizzes },
    ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('blocks').select('id', { count: 'exact', head: true }),
        supabase.from('blocks').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('blocks').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('user_progress').select('id', { count: 'exact', head: true }),
    ]);

    const { data: lowScoreLessons } = await supabase
        .from('user_progress')
        .select('lesson_id, score, lessons(title)')
        .lt('score', 60)
        .order('score', { ascending: true })
        .limit(5);

    return {
        feedback: feedback ?? [],
        metrics: { totalUsers, totalBlocks, draftBlocks, pendingReview, totalQuizzes },
        lowScoreLessons: lowScoreLessons ?? [],
    };
};

export const actions = {
    resolve: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const feedbackId = data.get('feedback_id') as string;
        const { error } = await supabase
            .from('user_feedback')
            .update({ resolved: true })
            .eq('id', feedbackId);
        if (error) return fail(500, { error: error.message });
        return { success: true };
    },

    resolveAll: async ({ locals: { supabase } }) => {
        const { error } = await supabase
            .from('user_feedback')
            .update({ resolved: true })
            .eq('resolved', false);
        if (error) return fail(500, { error: error.message });
        return { success: true };
    },
};
