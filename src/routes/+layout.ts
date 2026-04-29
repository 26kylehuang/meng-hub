import { createBrowserClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const load = async ({ locals: { supabase: serverSupabase, session, userRole }, depends, fetch }) => {
    depends('supabase:auth');

    const supabase = isBrowser()
        ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { global: { fetch } })
        : serverSupabase;

    const { data: curriculumTree, error } = await supabase
        .from('classes')
        .select(`
            id, title, is_ap,
            units (
                id, title, sequence_order,
                lessons ( id, title, sequence_order, lesson_type )
            )
        `)
        .order('title');

    if (error) console.error('Curriculum fetch error:', error.message);

    if (curriculumTree) {
        curriculumTree.forEach((c: any) => {
            c.units?.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
            c.units?.forEach((u: any) => {
                u.lessons?.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
            });
        });
    }

    let feedbackCount = 0;
    if (session && userRole === 'admin') {
        const { count } = await supabase
            .from('user_feedback')
            .select('id', { count: 'exact', head: true })
            .eq('resolved', false);
        feedbackCount = count ?? 0;
    }

    return {
        supabase,
        session,
        userRole,
        feedbackCount,
        curriculum: curriculumTree ?? [],
        apClasses:  curriculumTree?.filter((c: any) => c.is_ap)  ?? [],
        coreClasses: curriculumTree?.filter((c: any) => !c.is_ap) ?? [],
    };
};
