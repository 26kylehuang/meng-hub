import { error, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, session } }) => {
    if (!session) throw redirect(303, '/auth');

    const { classID } = params;

    const { data: classDetails, error: classError } = await supabase
        .from('classes')
        .select('id, title, description, is_ap')
        .eq('id', classID)
        .single();

    if (classError || !classDetails) throw error(404, 'Class not found.');

    const { data: allUnits } = await supabase
        .from('units')
        .select('id, title, sequence_order, lessons(id, title, sequence_order, is_priority)')
        .eq('class_id', classID)
        .order('sequence_order', { ascending: true });

    const sortedUnits = (allUnits ?? []).map((u: any) => ({
        ...u,
        lessons: (u.lessons ?? []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
    }));

    const allLessonIds = sortedUnits.flatMap((u: any) => u.lessons.map((l: any) => l.id));
    const { data: completions } = allLessonIds.length
        ? await supabase
            .from('lesson_completions')
            .select('lesson_id')
            .eq('user_id', session.user.id)
            .in('lesson_id', allLessonIds)
        : { data: [] };

    const completedSet = new Set((completions ?? []).map((c: any) => c.lesson_id));

    const unitsWithCompletion = sortedUnits.map((u: any) => ({
        ...u,
        lessons: u.lessons.map((l: any) => ({ ...l, is_completed: completedSet.has(l.id) })),
    }));

    const totalLessons = allLessonIds.length;
    const completedCount = completedSet.size;

    const thisWeeksFocus = sortedUnits
        .flatMap((u: any) => u.lessons)
        .filter((l: any) => l.is_priority);

    return {
        classDetails,
        allUnits: unitsWithCompletion,
        thisWeeksFocus,
        totalLessons,
        completedCount,
    };
};
