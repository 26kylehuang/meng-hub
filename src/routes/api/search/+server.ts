import { json } from '@sveltejs/kit';

export async function GET({ url, locals }) {
    const { session, supabase } = locals;
    if (!session) return json({ error: 'Unauthorized' }, { status: 403 });

    const q       = (url.searchParams.get('q') ?? '').trim();
    const classId = url.searchParams.get('class_id') ?? null;
    const type    = url.searchParams.get('type') ?? 'all';

    if (q.length < 1) return json({ concepts: [], lessons: [] });

    const results: any = { concepts: [], lessons: [] };

    if (type === 'concepts' || type === 'all') {
        const { data: concepts } = await supabase
            .from('concepts')
            .select('id, title, content_json, class_ids')
            .ilike('title', `%${q}%`)
            .limit(30);

        if (concepts) {
            const scored = concepts.map((c: any) => {
                const titleLower = c.title.toLowerCase();
                const qLower = q.toLowerCase();
                let score = titleLower.includes(qLower) ? 60 : 0;
                if (titleLower.startsWith(qLower)) score = 80;
                if (titleLower === qLower) score = 100;
                if (classId && (c.class_ids ?? []).includes(classId)) score += 30;
                const preview = (c.content_json ?? [])
                    .find((b: any) => b.type === 'paragraph')
                    ?.content?.slice(0, 100) ?? '';
                const inCurrentClass = classId && (c.class_ids ?? []).includes(classId);
                return { ...c, score, preview, inCurrentClass };
            });
            scored.sort((a: any, b: any) => b.score - a.score);
            results.concepts = scored.slice(0, 12);
        }
    }

    if (type === 'lessons' || type === 'all') {
        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, title, units(title, class_id, classes(id, title, is_ap))')
            .ilike('title', `%${q}%`)
            .limit(10);

        if (lessons) {
            const scored = (lessons as any[]).map((l: any) => {
                const inCurrentClass = classId && l.units?.class_id === classId;
                return { ...l, inCurrentClass, score: inCurrentClass ? 80 : 40 };
            });
            scored.sort((a: any, b: any) => b.score - a.score);
            results.lessons = scored;
        }
    }

    return json(results);
}

export async function POST({ locals }) {
    const { session, supabase } = locals;
    if (!session) return json({ error: 'Unauthorized' }, { status: 403 });

    const { data: nemesisRows } = await supabase
        .from('nemesis_tracker')
        .select('block_id, consecutive_fails, blocks(content_json, lesson_id)')
        .eq('user_id', session.user.id)
        .gt('consecutive_fails', 0)
        .order('consecutive_fails', { ascending: false })
        .limit(20);

    const questions = (nemesisRows ?? [])
        .map((r: any) => {
            const cj = r.blocks?.content_json;
            if (!cj?.question_text && !cj?.parts) return null;
            return { ...cj, block_id: r.block_id, lesson_id: r.blocks?.lesson_id, topic: 'Nemesis Review' };
        })
        .filter(Boolean);

    return json({ questions });
}
