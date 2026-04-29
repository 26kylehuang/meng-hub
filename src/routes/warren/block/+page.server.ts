import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ url, locals: { supabase, session, userRole } }) => {
    if (!session) throw redirect(303, '/auth');
    if (userRole === 'student') throw redirect(303, '/');

    const blockId = url.searchParams.get('id');
    if (!blockId) throw error(400, 'Missing block id');

    const { data: block } = await supabase
        .from('blocks')
        .select(`*, lessons(id, title, units(id, title, class_id, classes(title)))`)
        .eq('id', blockId)
        .single();

    if (!block) throw error(404, 'Block not found');

    if (userRole !== 'admin' && block.assigned_warren_id !== session.user.id) {
        throw redirect(303, '/warren');
    }

    return { block };
};

export const actions = {
    save: async ({ request, locals: { supabase } }) => {
        const data = await request.formData();
        const blockId     = data.get('block_id') as string;
        const content     = data.get('content') as string | null;
        const contentJson = data.get('content_json') as string | null;
        const warrenNotes = data.get('warren_notes') as string | null;

        const updateData: any = { warren_notes: warrenNotes };
        if (content !== null) updateData.content = content;
        if (contentJson) {
            try { updateData.content_json = JSON.parse(contentJson); } catch {
                return fail(400, { error: 'Invalid JSON in content.' });
            }
        }

        const { error } = await supabase.from('blocks').update(updateData).eq('id', blockId);
        if (error) return fail(500, { error: error.message });
        return { saved: true };
    },

    publish: async ({ request, locals: { supabase, session } }) => {
        const data = await request.formData();
        const blockId     = data.get('block_id') as string;
        const content     = data.get('content') as string | null;
        const contentJson = data.get('content_json') as string | null;
        const warrenNotes = data.get('warren_notes') as string | null;

        const updateData: any = { status: 'published', warren_notes: warrenNotes };
        if (content !== null) updateData.content = content;
        if (contentJson) {
            try { updateData.content_json = JSON.parse(contentJson); } catch {
                return fail(400, { error: 'Invalid JSON — fix before publishing.' });
            }
        }

        const { error } = await supabase
            .from('blocks').update(updateData)
            .eq('id', blockId)
            .eq('assigned_warren_id', session!.user.id);

        if (error) return fail(500, { error: error.message });
        throw redirect(303, '/warren?published=1');
    },
};
