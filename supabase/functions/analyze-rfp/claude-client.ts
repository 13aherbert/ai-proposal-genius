import { ANTHROPIC_API_VERSION, CLAUDE_MODEL, MAX_TOKENS, MAX_RETRIES } from './config.ts';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeWithClaude(
  prompt: string, 
  content: string, 
  anthropicApiKey: string, 
  retries = MAX_RETRIES
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nAnalyze this RFP document content:\n\n${content}`
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Anthropic API error (attempt ${attempt + 1}):`, errorData);
        
        if (response.status === 429 && attempt < retries - 1) {
          const waitTime = 2000 * (attempt + 1);
          console.log(`Rate limit hit, attempt ${attempt + 1}. Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
          continue;
        }
        throw new Error(`Anthropic API error: ${errorData}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      if (attempt === retries - 1) throw error;
      const waitTime = 2000 * (attempt + 1);
      console.log(`Error occurred, waiting ${waitTime}ms before retry...`);
      await sleep(waitTime);
    }
  }
  throw new Error('Failed after all retry attempts');
}
