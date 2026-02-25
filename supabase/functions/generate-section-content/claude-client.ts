// Anthropic Claude client for section content generation
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function generateWithClaude(prompt: string, apiKey?: string, model: string = 'claude-sonnet-4-20250514'): Promise<string> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
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
    if (response.status === 529) {
      throw new Error('Anthropic API overloaded (529), please try again later.');
    }
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please check your Anthropic billing.');
    }
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  return result.content[0].text;
}