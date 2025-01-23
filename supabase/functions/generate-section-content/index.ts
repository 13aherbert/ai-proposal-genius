import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionTitle } = await req.json();
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      throw new Error('API key configuration is missing');
    }

    console.log(`Generating content for section: ${sectionTitle}`);
    
    const prompt = `Write the ${sectionTitle} section. Be detailed and thorough. Use a formal tone, with the focus on presenting information in a clear and detailed manner. Write in the active voice.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2024-02-15-preview',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: 'You are an expert proposal writer, skilled at creating professional and detailed content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error response:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to generate content with Claude: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Claude API response received');

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Unexpected response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from Claude API');
    }

    const generatedContent = data.content[0].text;

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-section-content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});