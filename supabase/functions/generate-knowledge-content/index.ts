
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generatePrompt } from "./prompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const MAX_CONTEXT_CHARS = 15000;
const MAX_ENTRY_CHARS = 500;

interface KnowledgeEntry {
  title: string;
  category: string;
  content: string | null;
  parsed_content: string | null;
}

function formatExistingEntries(entries: KnowledgeEntry[], currentCategory: string): string {
  if (!entries || entries.length === 0) return "";

  // Prioritize entries in the same category
  const sameCategoryEntries = entries.filter(e => e.category === currentCategory);
  const otherEntries = entries.filter(e => e.category !== currentCategory);
  const sortedEntries = [...sameCategoryEntries, ...otherEntries];

  let totalChars = 0;
  const formattedEntries: string[] = [];

  for (const entry of sortedEntries) {
    if (totalChars >= MAX_CONTEXT_CHARS) break;

    const entryContent = entry.parsed_content || entry.content;
    if (!entryContent || entryContent.trim().length === 0) continue;

    const truncatedContent = entryContent.length > MAX_ENTRY_CHARS
      ? entryContent.substring(0, MAX_ENTRY_CHARS) + "..."
      : entryContent;

    const formatted = `### ${entry.title} [${entry.category}]\n${truncatedContent}`;
    totalChars += formatted.length;
    formattedEntries.push(formatted);
  }

  return formattedEntries.join("\n\n");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, industry, category, customPrompt, organizationId } = await req.json();
    
    if (!topic || !industry || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, industry, or category" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating content for topic: ${topic}, industry: ${industry}, category: ${category}`);

    // Fetch existing knowledge base entries for context
    let existingContent = "";
    if (organizationId) {
      try {

        const { data: entries, error: fetchError } = await supabaseClient
          .from('knowledge_entries')
          .select('title, category, content, parsed_content')
          .eq('organization_id', organizationId)
          .order('category', { ascending: true });

        if (fetchError) {
          console.error("Error fetching existing entries:", fetchError);
        } else if (entries && entries.length > 0) {
          existingContent = formatExistingEntries(entries, category);
          console.log(`Found ${entries.length} existing entries, using ${existingContent.length} chars of context`);
        } else {
          console.log("No existing knowledge base entries found for context");
        }
      } catch (fetchErr) {
        console.error("Failed to fetch existing entries, proceeding without context:", fetchErr);
      }
    }
    
    // Generate the prompt for Claude
    const prompt = generatePrompt(topic, industry, category, customPrompt, existingContent);
    console.log("Generated prompt for Claude");

    // Call Lovable AI Gateway to generate content
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey!}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-knowledge-content:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
