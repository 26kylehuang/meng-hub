import { json } from '@sveltejs/kit';
import { OPENROUTER_API_KEY } from '$env/static/private';

export async function POST({ request, locals }) {
    const session = locals.session;
    const role = locals.userRole;
    if (!session || (role !== 'admin' && role !== 'warren')) {
        return json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { prompt, systemPrompt, model, images } = await request.json();
    if (!prompt) return json({ error: 'No prompt provided.' }, { status: 400 });

    const userContent: any[] = images?.length
        ? [
            ...images.map((b64: string) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${b64}` }
            })),
            { type: 'text', text: prompt }
          ]
        : prompt;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://menghub.com',
                'X-Title': 'Meng Hub Archive',
            },
            body: JSON.stringify({
                model: model || 'anthropic/claude-3.5-sonnet',
                messages: [
                    { role: 'system', content: systemPrompt || 'You are a helpful academic content assistant. Always respond with valid JSON.' },
                    { role: 'user',   content: userContent },
                ],
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            return json({ success: false, error: `OpenRouter error: ${response.status}` }, { status: 502 });
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content;
        if (!result) return json({ success: false, error: 'Empty response from AI.' }, { status: 502 });

        return json({ success: true, result });

    } catch (e: any) {
        return json({ success: false, error: e.message ?? 'AI Forge connection failed.' }, { status: 500 });
    }
}
