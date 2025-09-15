
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GenerateContentRequest, Project, KnowledgeEntry } from "./types.ts";
import { generatePrompt } from "./prompt.ts";
import { formatKnowledgeBaseContext } from "./knowledge-base.ts";
import { assessKnowledgeBaseCoverage, validateGeneratedContent } from "./knowledge-validation.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

// Enhanced function to remove headers, meta-commentary and optimize for RFP conciseness
function cleanGeneratedContent(content: string, sectionTitle: string): string {
  let cleanedContent = content.trim();
  
  // Remove various header formats that might include the section title
  const headerPatterns = [
    new RegExp(`^#\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^##\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^###\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^\\*\\*${sectionTitle}\\*\\*\\s*\n?`, 'i'),
    new RegExp(`^\\*${sectionTitle}\\*\\s*\n?`, 'i'),
    new RegExp(`^${sectionTitle}\\s*[:|-]\\s*\n?`, 'i'),
  ];

  // Remove meta-commentary patterns
  const metaCommentaryPatterns = [
    /^Here is the .+ section.*/i,
    /^Below is the .+ section.*/i,
    /^The following .+ section.*/i,
    /^This section .+/i,
    /^Based on the (knowledge base|provided information).*/i,
    /^Using the (knowledge base|provided information).*/i,
    /^According to the (knowledge base|provided information).*/i,
    /^From the (knowledge base|provided information).*/i,
    /^Drawing from the knowledge base.*/i,
    /^The knowledge base (contains|provides|shows).*/i,
    /^I have (created|written|generated).*/i,
    /^I will (create|write|generate).*/i,
    /^Let me (create|write|generate).*/i,
    /^.*using only information from the.*knowledge base.*/i,
    /^.*leveraging the knowledge base.*/i,
    /^.*information available in the knowledge base.*/i,
    /^As mentioned in (other|previous) sections.*/i,
    /^Consistent with (other|previous) sections.*/i,
    /^To maintain consistency.*/i,
    /^Note:.*/i,
    /^Please note:.*/i,
    /^\*Note:.*/i,
    /^Important:.*/i,
  ];

  // Apply header pattern removal
  for (const pattern of headerPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Apply meta-commentary pattern removal
  for (const pattern of metaCommentaryPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Remove any lines that start with common meta-commentary phrases
  const lines = cleanedContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim().toLowerCase();
    return !(
      trimmedLine.startsWith('here is') ||
      trimmedLine.startsWith('below is') ||
      trimmedLine.startsWith('this section') ||
      trimmedLine.startsWith('based on') ||
      trimmedLine.startsWith('using the') ||
      trimmedLine.startsWith('according to') ||
      trimmedLine.startsWith('from the') ||
      trimmedLine.startsWith('drawing from') ||
      trimmedLine.startsWith('the knowledge base') ||
      trimmedLine.startsWith('as mentioned in') ||
      trimmedLine.startsWith('consistent with') ||
      trimmedLine.startsWith('to maintain consistency') ||
      trimmedLine.startsWith('i have') ||
      trimmedLine.startsWith('i will') ||
      trimmedLine.startsWith('let me')
    );
  });

  cleanedContent = filteredLines.join('\n');

  // Enhanced RFP-specific cleaning patterns
  const rfpFillerPhrases = [
    /\b(obviously|clearly|certainly|surely|undoubtedly)\b/gi,
    /\b(we believe that|we feel that|we think that)\b/gi,
    /\b(it is important to note that|it should be noted that)\b/gi,
    /\b(furthermore|moreover|additionally)\b(?=.*\bfurthermore|moreover|additionally\b)/gi, // Remove excessive transition words
    /\b(various|numerous|multiple)\s+(different|diverse)\b/gi,
    /\s+would\s+be\s+able\s+to\s+/gi, // Replace with stronger language
  ];

  // Apply RFP-specific cleaning
  for (const pattern of rfpFillerPhrases) {
    if (pattern.source.includes('would\\s+be\\s+able\\s+to')) {
      cleanedContent = cleanedContent.replace(pattern, ' will ');
    } else {
      cleanedContent = cleanedContent.replace(pattern, ' ');
    }
  }

  // Remove redundant phrases and strengthen language
  cleanedContent = cleanedContent
    .replace(/\bin order to\b/gi, 'to') // More concise
    .replace(/\bdue to the fact that\b/gi, 'because') // More direct
    .replace(/\bat this point in time\b/gi, 'now') // More concise
    .replace(/\bmake it possible to\b/gi, 'enable') // Stronger verb
    .replace(/\bis capable of\b/gi, 'can') // More direct
    .replace(/\bhas the ability to\b/gi, 'can') // More direct
    .replace(/\bprovide\s+you\s+with\b/gi, 'deliver') // Stronger verb

  // Remove any leading/trailing whitespace and multiple consecutive newlines
  cleanedContent = cleanedContent.trim().replace(/\n{3,}/g, '\n\n');
  
  // Clean up extra spaces
  cleanedContent = cleanedContent.replace(/\s{2,}/g, ' ');
  
  return cleanedContent;
}

// Validate content for any remaining meta-commentary
function validateContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();
  
  const problematicPhrases = [
    'here is the',
    'below is the',
    'this section',
    'based on the knowledge base',
    'using the knowledge base',
    'according to the knowledge base',
    'from the knowledge base',
    'knowledge base contains',
    'as mentioned in other sections',
    'consistent with previous sections',
    'to maintain consistency',
    'i have created',
    'i will create',
    'let me create'
  ];

  for (const phrase of problematicPhrases) {
    if (lowerContent.includes(phrase)) {
      issues.push(`Contains meta-commentary: "${phrase}"`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { projectId, sectionTitle, userId, strictMode = false } = await req.json() as GenerateContentRequest;

    console.log('Fetching project details for:', projectId);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (projectError) throw projectError;

    console.log('Fetching existing sections for consistency');
    const { data: existingSections, error: sectionsError } = await supabase
      .from('proposal_sections')
      .select('section_title, content')
      .eq('project_id', projectId)
      .neq('section_title', sectionTitle); // Exclude current section if updating

    if (sectionsError) {
      console.warn('Error fetching existing sections:', sectionsError);
    }

    console.log(`Found ${existingSections?.length || 0} existing sections for consistency check`);

    console.log('Fetching knowledge base entries');
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) throw knowledgeError;
    
    console.log(`Found ${knowledgeEntries?.length || 0} knowledge base entries`);
    
    // In strict mode, assess knowledge base coverage with intelligent semantic matching
    if (strictMode) {
      console.log('Smart strict mode enabled, assessing knowledge base coverage');
      const coverage = assessKnowledgeBaseCoverage(sectionTitle, knowledgeEntries as KnowledgeEntry[]);
      
      console.log(`Knowledge base coverage: ${coverage.coverageScore}% (${coverage.relevantEntries.length} relevant entries)`);
      console.log(`Section type: ${getSectionType(sectionTitle)}, Adequate: ${coverage.isAdequate}`);
      
      if (!coverage.isAdequate) {
        console.log(`Insufficient knowledge base coverage: ${coverage.coverageScore}%`);
        console.log(`Missing topics: ${coverage.missingTopics.slice(0, 3).join(', ')}`);
        console.log(`Relevant entries found: ${coverage.relevantEntries.map(e => e.title).join(', ')}`);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient knowledge base coverage',
            details: {
              coverageScore: coverage.coverageScore,
              missingTopics: coverage.missingTopics.slice(0, 5),
              recommendations: coverage.recommendations,
              relevantEntries: coverage.relevantEntries.length,
              sectionType: getSectionType(sectionTitle),
              availableEntries: coverage.relevantEntries.map(e => ({ title: e.title, category: e.category }))
            }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log(`Knowledge base coverage adequate: ${coverage.coverageScore}% - proceeding with generation`);
    }
    
    // Helper function for section type (used in logging)
    function getSectionType(title: string): string {
      const t = title.toLowerCase();
      if (t.includes('executive') || t.includes('summary') || t.includes('overview')) return 'executive';
      if (t.includes('technical') || t.includes('approach') || t.includes('methodology')) return 'technical';
      if (t.includes('team') || t.includes('staff') || t.includes('personnel')) return 'team';
      if (t.includes('timeline') || t.includes('schedule') || t.includes('milestones')) return 'timeline';
      if (t.includes('pricing') || t.includes('cost') || t.includes('budget')) return 'pricing';
      return 'general';
    }
    
    // Format knowledge base context
    const knowledgeBaseContext = formatKnowledgeBaseContext(knowledgeEntries as KnowledgeEntry[]);
    console.log('Knowledge base context formatted');

    // Generate the prompt with project, knowledge base context, and existing sections for consistency
    const prompt = generatePrompt(
      sectionTitle, 
      project as Project, 
      knowledgeBaseContext,
      existingSections?.filter(section => section.content && section.content.trim().length > 0) || [],
      strictMode
    );
    console.log('Prompt generated with consistency context, calling Claude API');

    // Enhanced retry logic with intelligent backoff and jitter
    let response: Response;
    let result: any;
    let lastError: Error | null = null;
    const maxAttempts = 5; // Increased retries for better resilience
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Add jitter to prevent thundering herd
        if (attempt > 1) {
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 2), 20000);
          const jitter = baseDelay * 0.1 * Math.random();
          const totalDelay = baseDelay + jitter;
          console.log(`Waiting ${Math.round(totalDelay)}ms before attempt ${attempt}`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }

        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-opus-4-20250514',
            max_tokens: 2500,
            temperature: 0.6,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        result = await response.json();
        console.log(`Claude API response received on attempt ${attempt}`);

        if (!response.ok) {
          const errorType = result.error?.type;
          const errorMessage = result.error?.message || 'Unknown error';
          
          // Handle different error types
          if (errorType === 'overloaded_error' || response.status === 429 || response.status === 503) {
            console.log(`API overloaded/rate limited on attempt ${attempt}/${maxAttempts}`);
            if (attempt < maxAttempts) {
              continue; // Retry with backoff
            }
          } else if (response.status === 500 || response.status === 502 || response.status === 504) {
            console.log(`Server error on attempt ${attempt}/${maxAttempts}: ${response.status}`);
            if (attempt < maxAttempts) {
              continue; // Retry server errors
            }
          }
          
          console.error('Claude API error:', result);
          throw new Error(`${errorMessage} (${errorType || response.status})`);
        }
        
        // Success - break out of retry loop
        break;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Claude API attempt ${attempt}/${maxAttempts} failed:`, error);
        
        // Don't retry on final attempt
        if (attempt === maxAttempts) {
          break;
        }
      }
    }
    
    if (lastError) {
      throw lastError;
    }

    // Get the generated content and clean it thoroughly
    let generatedContent = result.content[0].text;
    
    // Check for strict mode refusal
    if (strictMode && generatedContent.includes('INSUFFICIENT_KNOWLEDGE_BASE')) {
      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_KNOWLEDGE_BASE',
          message: generatedContent,
          suggestions: ['Add more detailed information to your knowledge base', 'Include specific examples and data', 'Upload relevant documents with detailed content']
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    const cleanedContent = cleanGeneratedContent(generatedContent, sectionTitle);
    
    // Enhanced validation for strict mode
    if (strictMode) {
      const knowledgeValidation = validateGeneratedContent(cleanedContent, knowledgeEntries as KnowledgeEntry[]);
      
      if (!knowledgeValidation.isValid) {
        console.warn('Strict mode validation failed:', knowledgeValidation.issues);
        return new Response(
          JSON.stringify({
            error: 'CONTENT_VALIDATION_FAILED',
            message: 'Generated content contains unverified claims',
            issues: knowledgeValidation.issues,
            confidenceScore: knowledgeValidation.confidenceScore,
            suggestions: ['Review and enhance your knowledge base with more specific information', 'Add supporting documentation with concrete data']
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      console.log(`Strict mode validation passed with confidence score: ${knowledgeValidation.confidenceScore}%`);
    }
    
    // Standard validation
    const validation = validateContent(cleanedContent);
    
    if (!validation.isValid) {
      console.warn('Content validation issues detected:', validation.issues);
      // Log the issues but don't fail - the cleaning should have handled most cases
    }
    
    console.log('Content processed, cleaned, validated, and consistency-checked');

    return new Response(
      JSON.stringify({
        content: cleanedContent
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in generate-section-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
