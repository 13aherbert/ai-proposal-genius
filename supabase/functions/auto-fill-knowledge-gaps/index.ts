import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { generateExtractionPrompt } from "./prompt.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const MAX_CONTEXT_CHARS = 30000;
const MAX_ENTRY_CHARS = 2000;

interface KnowledgeEntry {
  title: string;
  category: string;
  content: string | null;
  parsed_content: string | null;
}

function formatAllEntries(entries: KnowledgeEntry[]): string {
  if (!entries || entries.length === 0) return "";

  // Sort by content length descending (richer entries first)
  const sorted = [...entries].sort((a, b) => {
    const aLen = (a.parsed_content || a.content || "").length;
    const bLen = (b.parsed_content || b.content || "").length;
    return bLen - aLen;
  });

  let totalChars = 0;
  const formatted: string[] = [];

  for (const entry of sorted) {
    if (totalChars >= MAX_CONTEXT_CHARS) break;

    const entryContent = entry.parsed_content || entry.content;
    if (!entryContent || entryContent.trim().length === 0) continue;

    const truncated = entryContent.length > MAX_ENTRY_CHARS
      ? entryContent.substring(0, MAX_ENTRY_CHARS) + "..."
      : entryContent;

    const line = `### ${entry.title} [${entry.category}]\n${truncated}`;
    totalChars += line.length;
    formatted.push(line);
  }

  return formatted.join("\n\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, gapCategories, industry } = await req.json();

    if (!organizationId || !gapCategories || !Array.isArray(gapCategories) || gapCategories.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: organizationId, gapCategories" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auto-filling ${gapCategories.length} gap categories for org ${organizationId}`);

    // Fetch all existing entries
    const { data: entries, error: fetchError } = await supabaseClient
      .from('knowledge_entries')
      .select('title, category, content, parsed_content')
      .eq('organization_id', organizationId);

    if (fetchError) throw new Error(`Failed to fetch entries: ${fetchError.message}`);

    const existingContent = formatAllEntries(entries || []);
    console.log(`Formatted ${(entries || []).length} entries into ${existingContent.length} chars of context`);

    if (existingContent.length === 0) {
      return new Response(
        JSON.stringify({ error: "No existing knowledge base content found to extract from" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { category: string; success: boolean; entryId?: string; error?: string }[] = [];

    // Process each gap category sequentially to avoid rate limits
    for (const gapCategory of gapCategories) {
      try {
        console.log(`Processing gap: ${gapCategory}`);
        const prompt = generateExtractionPrompt(gapCategory, existingContent, industry || 'general');

        const apiKey = LOVABLE_API_KEY;
        if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI error for ${gapCategory}:`, errorText);
          if (response.status === 429) {
            results.push({ category: gapCategory, success: false, error: "Rate limited — try again shortly" });
            continue;
          }
          if (response.status === 402) {
            results.push({ category: gapCategory, success: false, error: "AI credits exhausted" });
            continue;
          }
          throw new Error(`AI error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content returned from AI");

        // Insert the new entry
        const { data: inserted, error: insertError } = await supabaseClient
          .from('knowledge_entries')
          .insert({
            title: gapCategory,
            category: gapCategory,
            content: content,
            organization_id: organizationId,
            user_id: user.id,
            migration_status: 'auto_generated',
          })
          .select('entry_id')
          .single();

        if (insertError) {
          console.error(`Insert error for ${gapCategory}:`, insertError);
          results.push({ category: gapCategory, success: false, error: insertError.message });
        } else {
          console.log(`Created entry for ${gapCategory}: ${inserted.entry_id}`);
          results.push({ category: gapCategory, success: true, entryId: inserted.entry_id });
        }
      } catch (err: any) {
        console.error(`Failed to process ${gapCategory}:`, err);
        results.push({ category: gapCategory, success: false, error: err.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${gapCategories.length} gaps filled`);

    return new Response(
      JSON.stringify({ results, filled: successCount, total: gapCategories.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Error in auto-fill-knowledge-gaps:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
