import { Project } from './types.ts';

// Determine section type for specialized prompting
function getSectionType(sectionTitle: string): 'executive' | 'technical' | 'team' | 'timeline' | 'pricing' | 'general' {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary') || title.includes('overview')) {
    return 'executive';
  }
  if (title.includes('technical') || title.includes('approach') || title.includes('methodology') || title.includes('solution')) {
    return 'technical';
  }
  if (title.includes('team') || title.includes('personnel') || title.includes('staff') || title.includes('experience')) {
    return 'team';
  }
  if (title.includes('timeline') || title.includes('schedule') || title.includes('milestone') || title.includes('delivery')) {
    return 'timeline';
  }
  if (title.includes('cost') || title.includes('price') || title.includes('budget') || title.includes('financial')) {
    return 'pricing';
  }
  return 'general';
}

// Get section-specific writing guidelines
function getSectionGuidelines(sectionType: string): string {
  switch (sectionType) {
    case 'executive':
      return `EXECUTIVE SUMMARY GUIDELINES:
- Lead with the most compelling value proposition and key differentiator
- Include quantifiable ROI or business impact (percentages, timeframes, savings)
- State the specific client benefit in the first sentence
- Keep paragraphs to 2-3 sentences maximum
- End with a strong call to action or next step`;
      
    case 'technical':
      return `TECHNICAL APPROACH GUIDELINES:
- Start with the specific outcome this approach will achieve for the client
- Structure as: Problem → Solution → Benefit → Proof
- Include specific methodologies, tools, or frameworks with proven results
- Quantify technical benefits (performance improvements, efficiency gains)
- Address potential risks and mitigation strategies`;
      
    case 'team':
      return `TEAM/EXPERIENCE GUIDELINES:
- Lead with most relevant and impressive project achievements
- Include specific results and outcomes (not just activities)
- Quantify success metrics from past projects
- Focus on team members directly relevant to this project
- Highlight unique qualifications that differentiate from competitors`;
      
    case 'timeline':
      return `TIMELINE/DELIVERY GUIDELINES:
- Start with the final delivery date and work backwards
- Include buffer time for risk mitigation
- Highlight accelerated delivery capabilities if applicable
- Show parallel work streams to optimize timing
- Include key client decision points and dependencies`;
      
    case 'pricing':
      return `PRICING GUIDELINES:
- Lead with total value delivered, not just cost
- Structure pricing to show clear value at each tier
- Include payment terms that benefit the client's cash flow
- Highlight cost savings or ROI compared to alternatives
- Show pricing transparency with detailed breakdowns`;
      
    default:
      return `GENERAL SECTION GUIDELINES:
- Start with the most important client benefit
- Support claims with specific evidence and examples
- Include quantifiable results where possible
- Address potential client concerns proactively
- End with clear next steps or commitments`;
  }
}

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string,
  existingSections?: Array<{section_title: string, content: string}>,
  strictMode = false
): string {
  const sectionType = getSectionType(sectionTitle);
  const sectionGuidelines = getSectionGuidelines(sectionType);
  
  const isCostRelatedSection = sectionType === 'pricing';

  // Extract key information from existing sections for consistency
  let consistencyContext = '';
  if (existingSections && existingSections.length > 0) {
    consistencyContext = `\n\nEXISTING SECTIONS FOR CONSISTENCY:
These proposal sections already exist. You MUST maintain absolute consistency with all pricing, timelines, company information, project scope, and deliverables:

`;
    
    existingSections.forEach(section => {
      consistencyContext += `=== ${section.section_title} ===\n${section.content}\n\n`;
    });

    consistencyContext += `CONSISTENCY REQUIREMENTS:
- Use IDENTICAL pricing, timelines, and project details
- Maintain same company capabilities and team information  
- Never contradict established information
- Align tone and detail level with existing sections
`;
  }

  const costSpecificInstructions = isCostRelatedSection ? `
PRICING SECTION STRATEGY:
1. FIRST priority: Use exact pricing from existing sections or knowledge base
2. If no pricing exists: Create competitive pricing based on RFP requirements and project scope
3. Structure: Total value delivered → Detailed breakdown → Payment terms → ROI justification
4. Include risk mitigation through milestone-based payments
5. Show cost transparency and value comparison to alternatives` : '';

  return `You are an expert RFP proposal writer creating the "${sectionTitle}" section. This section must win against strong competition by demonstrating clear, quantifiable value to the client.

PROJECT CONTEXT:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- RFP Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}${consistencyContext}

${sectionGuidelines}

${costSpecificInstructions}

RFP WINNING STRATEGY - CRITICAL REQUIREMENTS:
1. LENGTH: Keep content between 200-500 words unless the section specifically requires more detail
2. LEAD WITH IMPACT: First sentence must state the specific client benefit or value
3. QUANTIFY EVERYTHING: Include specific percentages, timeframes, cost savings, or performance improvements
4. COMPETITIVE EDGE: Highlight unique differentiators that competitors cannot match
5. RISK MITIGATION: Address potential concerns and show how you minimize client risk
6. PROOF POINTS: Use specific examples and results from knowledge base (never invent)
7. ACTIVE VOICE: Write with confidence and authority - avoid passive constructions
8. CLIENT-FOCUSED: Every paragraph must answer "What's in it for them?"

  if (strictMode) {
    prompt += `
🚫 ULTRA-STRICT ANTI-HALLUCINATION MODE ACTIVATED 🚫

MANDATORY REQUIREMENTS (VIOLATION = IMMEDIATE REFUSAL):
1. ZERO TOLERANCE POLICY: Use ONLY information explicitly stated in the knowledge base above
2. NO SYNTHESIS: Do not combine or extrapolate from knowledge base information  
3. NO ASSUMPTIONS: Do not fill gaps with industry standards or general knowledge
4. NO CREATIVE WRITING: Do not generate plausible-sounding but unverified content
5. EXACT INFORMATION ONLY: Every number, date, process, or claim must exist verbatim in the knowledge base

REFUSAL TRIGGER CONDITIONS:
- Knowledge base lacks specific information for any part of this section
- Missing concrete details like pricing, timelines, team qualifications, or technical specifications
- Insufficient content volume to create a comprehensive section
- Any doubt about information accuracy or source

RESPONSE PROTOCOL:
- IF INSUFFICIENT DATA: Respond exactly with "INSUFFICIENT_KNOWLEDGE_BASE_DATA - [specific missing information]"
- IF ADEQUATE DATA: Create section using ONLY verified knowledge base information with explicit citations

ULTRA-STRICT VERIFICATION CHECKLIST:
✓ Every sentence maps to specific knowledge base content?
✓ All numbers/percentages/dates are from knowledge base verbatim?
✓ Zero general industry knowledge or assumptions used?
✓ No "reasonable" inferences or logical deductions made?  
✓ Section is complete without any creative gap-filling?

REMEMBER: Better to refuse generation than risk any hallucination. When in doubt, always refuse.`;
  }

ABSOLUTE CONSISTENCY:
- Use identical pricing, timelines, and details from existing sections
- Never contradict previously established information
- Maintain consistent company capabilities and team qualifications

FORBIDDEN CONTENT:
- NO meta-commentary about writing process
- NO generic business language or filler phrases  
- NO invented examples or capabilities
- NO section headers or titles in response
- NO references to "knowledge base," "existing sections," or consistency requirements
- NO weak language like "we believe," "we think," "would be able to"

WRITING STYLE:
- Use persuasive, confident language that demonstrates expertise
- Start immediately with substantive content (no introductions)
- Write as the proposal itself, not about the proposal
- Focus on measurable outcomes and client success
- Use strong action verbs and specific commitments
- End with clear value proposition or next step

Generate ONLY the body content for "${sectionTitle}" - be the winning proposal section that beats the competition:`;
}