import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
    const { session, userRole, supabase } = locals;
    if (!session || (userRole !== 'admin' && userRole !== 'warren')) {
        return json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { lesson_id, blocks } = await request.json();
    if (!lesson_id || !Array.isArray(blocks)) {
        return json({ error: 'Missing lesson_id or blocks array.' }, { status: 400 });
    }

    const { data: existing } = await supabase
        .from('blocks')
        .select('sequence_order')
        .eq('lesson_id', lesson_id)
        .order('sequence_order', { ascending: false })
        .limit(1);

    const startOrder = (existing?.[0]?.sequence_order ?? 0) + 1;

    const rows = blocks.map((block: any, i: number) => {
        const isJsonBlock = ['quiz', 'timeline', 'frq', 'summary'].includes(block.type);
        return {
            lesson_id,
            type:           block.type,
            content:        isJsonBlock ? null : (block.content ?? null),
            content_json:   isJsonBlock ? block : (block.content_json ?? null),
            caption:        block.caption ?? null,
            sequence_order: startOrder + i,
            status:         'pending_review',
        };
    });

    const { data, error } = await supabase.from('blocks').insert(rows).select('id');
    if (error) return json({ success: false, error: error.message }, { status: 500 });

    return json({ success: true, count: data?.length ?? rows.length });
}
