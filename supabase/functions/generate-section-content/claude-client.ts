import { ClaudeResponse } from './types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-opus-20240229';

/**
 * Makes a request to the Claude API to generate content
 * @param prompt - The complete prompt to send to Claude
 * @param apiKey - Claude API key
 * @returns Generated content text
 * @throws Error if the API request fails
 */
export async function generateWithClaude(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error('Claude API error:', response.status, response.statusText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json() as ClaudeResponse;
  
  if (!data.content?.[0]?.text) {
    console.error('Unexpected response structure:', JSON.stringify(data));
    throw new Error('Invalid response structure from Claude API');
  }

  return data.content[0].text;
}