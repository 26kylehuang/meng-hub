import { json } from '@sveltejs/kit';
import { OPENROUTER_API_KEY } from '$env/static/private';

export async function POST({ request, locals }) {
    const { session, userRole, supabase } = locals;
    if (!session || (userRole !== 'admin' && userRole !== 'warren')) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { rawText } = await request.json();
    if (!rawText?.trim()) return json({ error: 'No text provided' }, { status: 400 });

    const { data: classes } = await supabase
        .from('classes')
        .select(`
            id, title, is_ap,
            units(
                id, title, sequence_order,
                lessons(
                    id, title, sequence_order,
                    blocks(id, type, content, content_json)
                )
            )
        `)
        .order('title');

    const curriculumMap = (classes ?? []).map((cls: any) => ({
        class_id: cls.id,
        class_title: cls.title,
        is_ap: cls.is_ap,
        units: (cls.units ?? []).map((u: any) => ({
            unit_id: u.id,
            unit_title: u.title,
            lessons: (u.lessons ?? []).map((l: any) => ({
                lesson_id: l.id,
                lesson_title: l.title,
                block_count: l.blocks?.length ?? 0,
                topic_sample: (l.blocks ?? []).slice(0, 3).map((b: any) =>
                    (b.content ?? b.content_json?.question_text ?? b.content_json?.title ?? '').slice(0, 80)
                ).filter(Boolean),
            }))
        }))
    }));

    const systemPrompt = `You are the Meng Hub Smart Router. Given raw academic text and the full curriculum structure, decide exactly where this content belongs.

CURRICULUM MAP:
${JSON.stringify(curriculumMap, null, 2)}

Decide one of three actions:
A. MERGE_INTO — content belongs inside an existing lesson
B. INJECT_AFTER — new sub-topic that should become a new lesson inside an existing unit
C. NEW_LESSON — genuinely new content needing a fresh lesson

OUTPUT JSON only:
{
  "action": "MERGE_INTO" | "INJECT_AFTER" | "NEW_LESSON",
  "confidence": 0.0-1.0,
  "reasoning": "One sentence explaining why",
  "target_lesson_id": "uuid or null",
  "target_lesson_title": "human readable or null",
  "target_unit_id": "uuid or null if NEW_LESSON",
  "target_class_id": "uuid",
  "suggested_lesson_title": "only if INJECT_AFTER or NEW_LESSON",
  "duplicate_warning": "describe any near-duplicate content, or null",
  "topics_detected": ["main topic", "subtopic 1"]
}

RULES:
- If content is >70% covered by existing lesson, action MUST be MERGE_INTO
- If near-duplicate detected, set duplicate_warning
- Never suggest creating a new class`;

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://menghub.com',
                'X-Title': 'Meng Hub Smart Router',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Route this content:\n\n${rawText.slice(0, 3000)}` },
                ],
                response_format: { type: 'json_object' },
            }),
            signal: AbortSignal.timeout(45000),
        });

        if (!res.ok) return json({ error: `OpenRouter error: ${res.status}` }, { status: 502 });
        const data = await res.json();
        const result = JSON.parse(data.choices[0].message.content);
        return json({ success: true, routing: result });

    } catch (e: any) {
        return json({ error: e.message ?? 'Routing failed' }, { status: 500 });
    }
}
