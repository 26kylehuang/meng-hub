import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session }, url }) => {
    if (!session) throw redirect(303, '/auth');

    const userId = session.user.id;
    const cleared = url.searchParams.get('status') === 'cleared';

    const { data: nemesisRows } = await supabase
        .from('nemesis_tracker')
        .select('consecutive_fails, block_id, blocks(lesson_id, content_json, lessons(title))')
        .eq('user_id', userId)
        .order('consecutive_fails', { ascending: false });

    const activeNemesis = (nemesisRows ?? []).filter((r: any) => r.consecutive_fails > 0);
    const nemesisCount  = activeNemesis.length;
    const masteredCount = (nemesisRows ?? []).filter((r: any) => r.consecutive_fails === 0).length;

    const { data: history } = await supabase
        .from('user_progress')
        .select('id, score, completed_at, lesson_id, lessons(title)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(20);

    return {
        nemesisCount,
        masteredCount,
        activeNemesis: activeNemesis.slice(0, 10),
        history: history ?? [],
        cleared,
    };
};
