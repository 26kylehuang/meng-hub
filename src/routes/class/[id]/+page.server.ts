import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');
    const { id } = params;

    const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*, units(id, title, class_id, classes(id, title))')
        .eq('id', id)
        .single();

    if (lessonError || !lesson) throw error(404, 'The requested archive could not be found.');

    const classId = lesson.units?.class_id ?? lesson.units?.classes?.id;

    const { data: navUnits } = classId ? await supabase
        .from('units')
        .select(`
            id, title, sequence_order,
            lessons(id, title, sequence_order, lesson_type)
        `)
        .eq('class_id', classId)
        .order('sequence_order', { ascending: true }) : { data: [] };

    const sortedNav = (navUnits ?? []).map((u: any) => ({
        ...u,
        lessons: (u.lessons ?? []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
    }));

    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('lesson_id', id)
        .eq('status', 'published')
        .order('sequence_order', { ascending: true });

    let quizSourceBlocks: any[] = blocks ?? [];
    if (lesson.lesson_type === 'chapter_quiz' || lesson.lesson_type === 'unit_quiz' || lesson.lesson_type === 'ap_exam') {
        const sourceUnitIds = lesson.lesson_type === 'unit_quiz' || lesson.lesson_type === 'ap_exam'
            ? sortedNav.map((u: any) => u.id)
            : [lesson.unit_id];

        const { data: sourceLessons } = await supabase
            .from('lessons')
            .select('id')
            .in('unit_id', sourceUnitIds)
            .eq('lesson_type', 'lesson');

        const sourceIds = (sourceLessons ?? []).map((l: any) => l.id);

        if (sourceIds.length > 0) {
            const { data: allBlocks } = await supabase
                .from('blocks')
                .select('*')
                .in('lesson_id', sourceIds)
                .eq('status', 'published')
                .order('sequence_order', { ascending: true });

            quizSourceBlocks = [
                ...(blocks ?? []),
                ...(allBlocks ?? []).filter((b: any) => b.content_json?.question_text || b.content_json?.parts)
            ];
        }
    }

    return {
        lesson,
        blocks: blocks ?? [],
        quizSourceBlocks,
        navUnits: sortedNav,
    };
};
