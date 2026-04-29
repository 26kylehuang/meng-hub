import { json } from '@sveltejs/kit';
import { OPENROUTER_API_KEY } from '$env/static/private';

export async function POST({ request, locals }) {
    const { session, userRole } = locals;
    if (!session || (userRole !== 'admin' && userRole !== 'warren')) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { block, instruction } = await request.json();
    if (!block) return json({ error: 'No block provided' }, { status: 400 });

    const blockJson = JSON.stringify(block, null, 2);

    const systemPrompt = `You are the Meng Hub AI Editor. You receive an existing content block and an edit instruction. Make the requested change surgically — preserve everything not mentioned in the instruction.

BLOCK TYPES:
- paragraph: has "content" field (text with [[links]])
- heading_2: has "content" field
- math: has "content" (LaTeX) and optional "caption"
- tip: has "title" and "content"
- timeline: has "title", "orientation", "events" array
- table/chart: has "title", "headers", "rows"
- proof: has "title", "steps" array, "conclusion"
- cloze: has "prefix_text", "answer", "suffix_text"
- frq: has "stimulus", "parts" array with prompt/model_answer/scoring_guide
- quiz: has "question_text", "options", "correct_index", "explanation", "why_wrong", "hint", "topic"
- summary: has "title", "points" array, "concept_questions" array

OUTPUT: return the complete updated block as JSON. Preserve the "type" field and all fields not mentioned. Fix LaTeX if editing math. If editing a quiz, ensure correct_index still matches the correct option.`;

    try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://menghub.com',
                'X-Title': 'Meng Hub AI Editor',
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `CURRENT BLOCK:\n${blockJson}\n\nINSTRUCTION: ${instruction}` },
                ],
                response_format: { type: 'json_object' },
            }),
            signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) return json({ error: `OpenRouter error: ${res.status}` }, { status: 502 });
        const data = await res.json();
        const updated = JSON.parse(data.choices[0].message.content);
        return json({ success: true, updated });

    } catch (e: any) {
        return json({ error: e.message ?? 'AI edit failed' }, { status: 500 });
    }
}
