import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
    const { session, userRole, supabase } = locals;
    if (!session || (userRole !== 'admin' && userRole !== 'warren')) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const lessonId = url.searchParams.get('lesson_id');
    if (!lessonId) return json({ error: 'Missing lesson_id' }, { status: 400 });

    const { data: blocks, error } = await supabase
        .from('blocks')
        .select('id, type, content, content_json, sequence_order')
        .eq('lesson_id', lessonId)
        .order('sequence_order', { ascending: true });

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ blocks: blocks ?? [] });
}
