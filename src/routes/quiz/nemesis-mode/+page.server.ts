import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const { data } = await supabase
        .from('nemesis_tracker')
        .select('consecutive_fails, block_id, blocks(id, lesson_id, content_json)')
        .eq('user_id', session.user.id)
        .gt('consecutive_fails', 0)
        .order('consecutive_fails', { ascending: false })
        .limit(20);

    if (!data || data.length === 0) throw redirect(303, '/progress?status=cleared');

    const questions = data
        .map((row: any) => {
            const cj = row.blocks?.content_json;
            if (!cj?.question_text && !cj?.parts) return null;
            return { ...cj, block_id: row.block_id, lesson_id: row.blocks?.lesson_id };
        })
        .filter(Boolean);

    return { questions };
};
