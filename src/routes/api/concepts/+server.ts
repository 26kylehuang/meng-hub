import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
    const { session, supabase } = locals;
    if (!session) return json({ error: 'Unauthorized' }, { status: 403 });

    const q = url.searchParams.get('q') ?? '';
    const { data } = await supabase
        .from('concepts')
        .select('id, title, content_json')
        .ilike('title', `%${q}%`)
        .limit(20);

    return json({ concepts: data ?? [] });
}

export async function POST({ request, locals }) {
    const { session, userRole, supabase } = locals;
    if (!session || (userRole !== 'admin' && userRole !== 'warren')) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, title, content_json } = await request.json();
    if (!title) return json({ error: 'Title required' }, { status: 400 });

    if (id) {
        const { data, error } = await supabase
            .from('concepts')
            .update({ title, content_json })
            .eq('id', id)
            .select()
            .single();
        if (error) return json({ error: error.message }, { status: 500 });
        return json({ success: true, concept: data });
    } else {
        const { data, error } = await supabase
            .from('concepts')
            .insert({ title, content_json })
            .select()
            .single();
        if (error) return json({ error: error.message }, { status: 500 });
        return json({ success: true, concept: data });
    }
}

export async function DELETE({ url, locals }) {
    const { session, userRole, supabase } = locals;
    if (!session || userRole !== 'admin') return json({ error: 'Unauthorized' }, { status: 403 });
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Missing id' }, { status: 400 });
    await supabase.from('concepts').delete().eq('id', id);
    return json({ success: true });
}
