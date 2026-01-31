import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Section {
  section_id: string;
  section_title: string;
  content: string | null;
}

interface ImprovementResult {
  section_id: string;
  section_title: string;
  original_content: string;
  improved_content: string;
  changes_applied: string[];
}

// Extract section-specific feedback from evaluation
function extractSectionFeedback(evaluation: string, sectionTitle: string): string {
  const lines = evaluation.split('\n');
  let feedback: string[] = [];
  let inSectionFeedback = false;
  let inPriorityRecs = false;
  
  // Look for mentions of this section throughout the evaluation
  const sectionLower = sectionTitle.toLowerCase();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Check if we're in the section-by-section feedback area
    if (lineLower.includes('section-by-section') || lineLower.includes('section feedback')) {
      inSectionFeedback = true;
    }
    
    if (lineLower.includes('priority') && lineLower.includes('recommendation')) {
      inPriorityRecs = true;
      inSectionFeedback = false;
    }
    
    // Capture lines that mention this section
    if (lineLower.includes(sectionLower)) {
      // Get this line and the next few lines for context
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].trim()) {
          feedback.push(lines[j]);
        }
        // Stop if we hit a new section header
        if (j > i && lines[j].startsWith('#')) break;
      }
    }
  }
  
  // Also extract priority recommendations that might apply
  const prioritySection = evaluation.match(/## 4\. PRIORITY IMPROVEMENT RECOMMENDATIONS([\s\S]*?)(?=## 5\.|$)/i);
  if (prioritySection) {
    const recommendations = prioritySection[1].split('\n').filter(line => {
      const lineLower = line.toLowerCase();
      return lineLower.includes(sectionLower) || 
             (line.match(/^\d+\./) && lineLower.includes('section'));
    });
    feedback.push(...recommendations);
  }
  
  return feedback.length > 0 
    ? feedback.join('\n') 
    : 'General improvement: Enhance specificity, add concrete examples, and ensure alignment with RFP requirements.';
}

async function improveSection(
  section: Section,
  evaluation: string,
  analysis: string,
  knowledgeBase: string
): Promise<ImprovementResult> {
  const sectionFeedback = extractSectionFeedback(evaluation, section.section_title);
  
  const systemPrompt = `You are an expert proposal writer revising content based on evaluator feedback.

QUALITY PROTOCOLS (MANDATORY):
1. ANTI-HALLUCINATION: Every statistic must be sourced as "[Number] (Source: [Entry])". If no source exists, do not include the statistic.
2. ANTI-VERBOSITY: Respect word limits. Be concise and impactful.
3. BANNED VOCABULARY: Never use: catastrophic, bulletproof, weaponize, synergy, cutting-edge, game-changing, revolutionary, best-in-class, world-class, leverage (as verb).
4. PROFESSIONAL TONE: Write for government evaluators - factual, clear, no marketing hyperbole.

Your task is to IMPROVE the section content by addressing the specific feedback while:
- Maintaining the original structure and key points
- Preserving accurate information
- Adding specificity and evidence where feedback indicates gaps
- Improving clarity and professional tone`;

  const userPrompt = `SECTION TITLE: ${section.section_title}

ORIGINAL CONTENT:
${section.content || 'No content'}

EVALUATOR FEEDBACK FOR THIS SECTION:
${sectionFeedback}

RFP CONTEXT:
${analysis ? analysis.substring(0, 2000) : 'No RFP analysis available'}

AVAILABLE KNOWLEDGE BASE (use for adding specific details):
${knowledgeBase ? knowledgeBase.substring(0, 3000) : 'No knowledge base available'}

INSTRUCTIONS:
1. Rewrite this section addressing all feedback points
2. Improve specificity with concrete details from the knowledge base
3. Maintain professional tone appropriate for government evaluators
4. Keep similar length to original unless expansion is specifically needed
5. Apply all quality protocols

OUTPUT: Return ONLY the improved section content. No commentary, no headers, no explanations.`;

  console.log(`Improving section: ${section.section_title}`);
  
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI error for ${section.section_title}:`, errorText);
    throw new Error(`Failed to improve section: ${section.section_title}`);
  }

  const result = await response.json();
  const improvedContent = result.choices?.[0]?.message?.content?.trim();
  
  if (!improvedContent) {
    throw new Error(`No improved content received for ${section.section_title}`);
  }

  // Extract what changes were made (simplified - just note that improvements were applied)
  const changesApplied = [
    'Applied evaluator feedback',
    'Enhanced specificity and evidence',
    'Improved professional tone'
  ];

  return {
    section_id: section.section_id,
    section_title: section.section_title,
    original_content: section.content || '',
    improved_content: improvedContent,
    changes_applied: changesApplied
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { projectId, evaluation, sections, analysis } = await req.json();

    if (!projectId || !evaluation || !sections || sections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: projectId, evaluation, sections' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Applying suggestions to ${sections.length} sections for project ${projectId}`);

    // Fetch knowledge base for the organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('project_id', projectId)
      .single();

    let knowledgeBase = '';
    if (project?.organization_id) {
      const { data: knowledge } = await supabase
        .from('knowledge_entries')
        .select('title, content, parsed_content')
        .eq('organization_id', project.organization_id)
        .limit(10);
      
      if (knowledge) {
        knowledgeBase = knowledge
          .map(k => `[${k.title}]: ${k.parsed_content || k.content || ''}`)
          .join('\n\n');
      }
    }

    // Process sections sequentially to avoid rate limits
    const improvements: ImprovementResult[] = [];
    const errors: string[] = [];

    for (const section of sections) {
      if (!section.content || section.content.trim().length === 0) {
        console.log(`Skipping empty section: ${section.section_title}`);
        continue;
      }

      try {
        const improvement = await improveSection(section, evaluation, analysis, knowledgeBase);
        improvements.push(improvement);
        
        // Update the section in the database
        const { error: updateError } = await supabase
          .from('proposal_sections')
          .update({ content: improvement.improved_content, updated_at: new Date().toISOString() })
          .eq('section_id', section.section_id);
        
        if (updateError) {
          console.error(`Failed to update section ${section.section_id}:`, updateError);
          errors.push(`Failed to save ${section.section_title}`);
        }
      } catch (error) {
        console.error(`Error improving section ${section.section_title}:`, error);
        errors.push(`Failed to improve ${section.section_title}: ${error.message}`);
      }
    }

    console.log(`Completed: ${improvements.length} sections improved, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        improvements,
        errors,
        summary: {
          total: sections.length,
          improved: improvements.length,
          failed: errors.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
