import { MAX_TOKENS, MAX_RETRIES, RATE_LIMIT_BACKOFF } from './config.ts';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeWithOpenAI(
  prompt: string, 
  content: string, 
  openaiApiKey: string, 
  retries = MAX_RETRIES
): Promise<string> {
  console.log('Starting OpenAI analysis with content length:', content.length);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}: Analyzing content`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes RFP documents.'
            },
            {
              role: 'user',
              content: `${prompt}\n\nAnalyze this RFP document content:\n\n${content}`
            }
          ],
          max_tokens: MAX_TOKENS,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, errorData);
        
        if (response.status === 429 || errorData.includes('rate limit')) {
          if (attempt < retries - 1) {
            const waitTime = RATE_LIMIT_BACKOFF * Math.pow(2, attempt);
            console.log(`Rate limit hit, waiting ${waitTime}ms before retry...`);
            await sleep(waitTime);
            continue;
          }
        }
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const data = await response.json();
      console.log('Successfully received OpenAI response');
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      
      if (error instanceof Error && error.message.includes('rate limit') && attempt < retries - 1) {
        const waitTime = RATE_LIMIT_BACKOFF * Math.pow(2, attempt);
        console.log(`Rate limit error, waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }
      
      if (attempt === retries - 1) throw error;
      
      const waitTime = RATE_LIMIT_BACKOFF * Math.pow(2, attempt);
      console.log(`Error occurred, waiting ${waitTime}ms before retry...`);
      await sleep(waitTime);
    }
  }
  throw new Error('Failed after all retry attempts');
}