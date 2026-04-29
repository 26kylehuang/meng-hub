import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const userId = session.user.id;

    const { data: nemesisRows } = await supabase
        .from('nemesis_tracker')
        .select('consecutive_fails')
        .eq('user_id', userId);

    const nemesisCount  = (nemesisRows ?? []).filter((r: any) => r.consecutive_fails > 0).length;
    const masteredCount = (nemesisRows ?? []).filter((r: any) => r.consecutive_fails === 0).length;

    const { count: lessonsCompleted } = await supabase
        .from('lesson_completions')
        .select('lesson_id', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { data: recentProgress } = await supabase
        .from('user_progress')
        .select('lesson_id, score, completed_at, lessons(title)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

    return {
        session,
        nemesisCount,
        masteredCount,
        lessonsCompleted: lessonsCompleted ?? 0,
        recentProgress: recentProgress ?? [],
    };
};
