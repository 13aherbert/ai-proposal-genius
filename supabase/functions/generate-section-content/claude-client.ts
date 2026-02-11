// Lovable AI Gateway client for section content generation
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export async function generateWithClaude(prompt: string, apiKey: string, model: string = 'google/gemini-2.5-flash'): Promise<string> {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    throw new Error(`AI Gateway error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}
