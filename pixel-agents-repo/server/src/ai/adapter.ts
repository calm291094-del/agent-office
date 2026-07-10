// server/src/ai/adapter.ts
const KEYLESSAI_URL = 'https://keylessai.thryx.workers.dev/v1';

export async function getAgentDecision(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${KEYLESSAI_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un agente en una oficina. Toma decisiones breves y genera respuestas en JSON. Responde siempre con un objeto que tenga "action" (puede ser "work", "think", "talk", "walk") y "message" (un texto corto que explique tu acción).'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`KeylessAI error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Error al comunicarse con KeylessAI:', error);
        // Retornar una acción por defecto en caso de fallo
        return JSON.stringify({ action: 'think', message: 'Estoy procesando mi siguiente paso.' });
    }
}
