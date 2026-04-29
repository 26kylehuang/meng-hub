import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole === 'student') throw redirect(303, '/');

    const { data: globalJobs } = await supabase
        .from('blocks')
        .select('id, type, lesson_id, status, lessons(title, units(title, classes(title)))')
        .eq('status', 'draft')
        .is('assigned_warren_id', null)
        .order('created_at', { ascending: false })
        .limit(30);

    const { data: myJobs } = await supabase
        .from('blocks')
        .select('id, type, lesson_id, status, due_date, lessons(title, units(title, classes(title)))')
        .eq('assigned_warren_id', session.user.id)
        .in('status', ['claimed', 'in_review'])
        .order('due_date', { ascending: true });

    const { data: reviewQueue } = await supabase
        .from('blocks')
        .select('id, type, lesson_id, status, review_instruction, created_at, lessons(title, units(title, classes(title)))')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true })
        .limit(20);

    return {
        globalJobs: globalJobs ?? [],
        myJobs: myJobs ?? [],
        reviewQueue: reviewQueue ?? [],
        session,
    };
};

export const actions = {
    claim: async ({ request, locals: { supabase, session } }) => {
        const data = await request.formData();
        const blockId = data.get('block_id') as string;
        if (!blockId) return fail(400, { error: 'Missing block_id' });

        const { error } = await supabase
            .from('blocks')
            .update({ status: 'claimed', assigned_warren_id: session!.user.id })
            .eq('id', blockId)
            .is('assigned_warren_id', null);

        if (error) return fail(500, { error: error.message });
        return { success: true };
    },

    drop: async ({ request, locals: { supabase, session } }) => {
        const data = await request.formData();
        const blockId = data.get('block_id') as string;
        if (!blockId) return fail(400, { error: 'Missing block_id' });

        const { error } = await supabase
            .from('blocks')
            .update({ status: 'draft', assigned_warren_id: null })
            .eq('id', blockId)
            .eq('assigned_warren_id', session!.user.id);

        if (error) return fail(500, { error: error.message });
        return { success: true };
    },

    publish: async ({ request, locals: { supabase, session } }) => {
        const data = await request.formData();
        const blockId = data.get('block_id') as string;
        if (!blockId) return fail(400, { error: 'Missing block_id' });

        const { error } = await supabase
            .from('blocks')
            .update({ status: 'published' })
            .eq('id', blockId)
            .eq('assigned_warren_id', session!.user.id);

        if (error) return fail(500, { error: error.message });
        return { success: true };
    },
};
