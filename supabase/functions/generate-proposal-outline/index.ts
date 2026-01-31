
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting outline generation...');
    const { projectId, analysis } = await req.json();

    if (!projectId || !analysis) {
      console.error('Missing required fields:', { projectId, hasAnalysis: !!analysis });
      throw new Error('Missing required fields: projectId and analysis');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('Lovable API key not configured');
      throw new Error('Lovable API key is not configured');
    }

    console.log('Calling Lovable AI Gateway for outline generation');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert proposal writer. Based on the RFP analysis provided, create a detailed proposal outline in markdown format. 
                     The outline should be well-structured with clear sections and subsections using markdown headers (# for main sections, ## for subsections).
                     Include bullet points for key items to be addressed in each section.`
          },
          {
            role: 'user',
            content: `Please create a proposal outline based on this RFP analysis:\n\n${analysis}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      
      throw new Error(`AI Gateway error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Lovable AI Gateway response received');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from AI Gateway:', data);
      throw new Error('Invalid response from AI Gateway');
    }

    const outline = data.choices[0].message.content;

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Saving outline to database');
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ 
        proposal_outline: outline,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (updateError) {
      console.error('Error saving outline:', updateError);
      throw new Error(`Failed to save outline: ${updateError.message}`);
    }

    console.log('Outline generated and saved successfully');
    return new Response(
      JSON.stringify({ outline }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-proposal-outline function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate outline', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
