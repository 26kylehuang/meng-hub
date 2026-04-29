import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const { data: classes } = await supabase
        .from('classes')
        .select(`
            id, title, is_ap,
            units(
                id, title, sequence_order,
                lessons(
                    id, title, sequence_order,
                    blocks(id, type, content_json)
                )
            )
        `)
        .order('title');

    const topics: any[] = [];
    for (const cls of classes ?? []) {
        for (const unit of cls.units ?? []) {
            for (const lesson of unit.lessons ?? []) {
                const quizBlocks = (lesson.blocks ?? []).filter(
                    (b: any) => b.content_json?.question_text || b.content_json?.parts
                );
                if (quizBlocks.length > 0) {
                    topics.push({
                        id: lesson.id,
                        name: lesson.title,
                        className: cls.title,
                        unitName: unit.title,
                        count: quizBlocks.length,
                        blocks: quizBlocks,
                    });
                }
            }
        }
    }

    return { topics };
};
