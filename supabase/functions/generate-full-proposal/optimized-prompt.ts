// Optimized prompt generation for token efficiency
// Creates compact, section-specific prompts to reduce API costs

export interface PromptConfig {
  sectionTitle: string;
  sectionType: string;
  rfpContext: string;
  knowledgeContext: string;
  allSections: string[];
  existingSections?: Map<string, string>;
  clientName?: string;
  businessName?: string;
}

// Compact section-specific guidelines (much shorter than verbose prompts)
const SECTION_GUIDELINES: { [key: string]: { focus: string; structure: string; tone: string } } = {
  executive: {
    focus: 'Strategic value, key benefits, ROI, competitive differentiation',
    structure: 'Hook → Key benefits (3-4) → Why us → Call to action',
    tone: 'Executive, confident, outcome-focused'
  },
  technical: {
    focus: 'Methodology, implementation approach, technical details, quality assurance',
    structure: 'Approach overview → Detailed steps → Tools/tech → Quality measures',
    tone: 'Technical, precise, systematic'
  },
  team: {
    focus: 'Team qualifications, experience, relevant expertise',
    structure: 'Team overview → Key roles → Qualifications → Track record',
    tone: 'Professional, credible, competency-focused'
  },
  pricing: {
    focus: 'Investment breakdown, value justification, payment terms',
    structure: 'Summary → Line items → Assumptions → Value props',
    tone: 'Clear, justified, value-oriented'
  },
  timeline: {
    focus: 'Project phases, milestones, deliverables, key dates',
    structure: 'Overview → Phases → Milestones → Dependencies',
    tone: 'Structured, clear, realistic'
  },
  company: {
    focus: 'Company background, capabilities, differentiators',
    structure: 'Who we are → What we do → Why we\'re different',
    tone: 'Authentic, confident, client-focused'
  },
  general: {
    focus: 'Clear value proposition, client benefits, supporting evidence',
    structure: 'Opening → Key points → Evidence → Summary',
    tone: 'Professional, persuasive, client-centric'
  }
};

/**
 * Extract key points from existing sections to avoid repetition
 * Returns a compact summary of already-covered topics
 */
function extractCoveredTopics(existingSections: Map<string, string>): string {
  if (!existingSections || existingSections.size === 0) {
    return '';
  }
  
  const topics: string[] = [];
  
  for (const [title, content] of existingSections) {
    // Extract first sentence or key phrase
    const firstSentence = content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10) {
      topics.push(`${title}: ${firstSentence.substring(0, 80)}...`);
    }
  }
  
  if (topics.length === 0) return '';
  
  return `\nALREADY COVERED (avoid repeating):\n${topics.slice(0, 5).join('\n')}\n`;
}

/**
 * Truncate RFP context to essential information
 */
function truncateRfpContext(rfpContext: string, maxLength: number = 8000): string {
  if (!rfpContext || rfpContext.length <= maxLength) {
    return rfpContext;
  }
  
  // Try to find natural break points
  const paragraphs = rfpContext.split(/\n\n+/);
  let truncated = '';
  
  for (const paragraph of paragraphs) {
    if ((truncated + paragraph).length > maxLength) {
      break;
    }
    truncated += paragraph + '\n\n';
  }
  
  if (truncated.length < maxLength * 0.5) {
    // If paragraphs are too long, just truncate
    truncated = rfpContext.substring(0, maxLength) + '...';
  }
  
  return truncated.trim();
}

/**
 * Generate an optimized prompt for section generation
 * ~70% smaller than original verbose prompts
 */
export function generateOptimizedPrompt(config: PromptConfig): string {
  const guidelines = SECTION_GUIDELINES[config.sectionType] || SECTION_GUIDELINES.general;
  
  // Truncate context to reasonable size
  const rfpSummary = truncateRfpContext(config.rfpContext);
  const coveredTopics = extractCoveredTopics(config.existingSections || new Map());
  
  // Build compact prompt
  const prompt = `TASK: Write the "${config.sectionTitle}" section for a business proposal.

${config.clientName ? `CLIENT: ${config.clientName}` : ''}
${config.businessName ? `OUR COMPANY: ${config.businessName}` : ''}

RFP REQUIREMENTS:
${rfpSummary}

${config.knowledgeContext}
${coveredTopics}
SECTION GUIDELINES:
- Focus: ${guidelines.focus}
- Structure: ${guidelines.structure}
- Tone: ${guidelines.tone}

RULES:
1. Address specific client needs from RFP
2. Use concrete examples from knowledge base
3. Focus on client outcomes and benefits
4. Be unique - don't repeat other sections
5. Keep persuasive but professional

PROPOSAL SECTIONS: ${config.allSections.join(', ')}

Generate comprehensive content for "${config.sectionTitle}":`;

  return prompt;
}

/**
 * Calculate estimated token count for a prompt (rough estimate)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Get prompt size comparison stats
 */
export function getPromptStats(optimizedPrompt: string, sectionType: string): {
  optimizedLength: number;
  estimatedTokens: number;
  sectionType: string;
} {
  return {
    optimizedLength: optimizedPrompt.length,
    estimatedTokens: estimateTokenCount(optimizedPrompt),
    sectionType
  };
}
