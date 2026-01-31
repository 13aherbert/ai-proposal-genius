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

// Get section-specific writing guidelines with anti-pattern warnings
function getSectionGuidelines(sectionType: string): string {
  switch (sectionType) {
    case 'executive':
      return `EXECUTIVE SUMMARY GUIDELINES:
- Lead with the client's specific problem, not your capabilities
- State the concrete outcome and measurable benefit in the first sentence
- Keep under 400 words - executives skim, not read
- MUST include at least one verifiable reference to past work
- AVOID generic superlatives - use specific outcomes instead
- End with a clear commitment and next step

ANTI-PATTERNS TO AVOID:
- "World-class", "cutting-edge", "industry-leading" (empty claims)
- Vague benefits without numbers: "significant improvement" 
- Capability lists without relevance to client's actual problem`;
      
    case 'technical':
      return `TECHNICAL APPROACH GUIDELINES:
- Start with the specific client outcome this approach achieves
- Provide actual tool/framework names, not "best-in-class tools"
- Structure: Problem → Methodology → Implementation → Evidence → Outcome
- Include specific dates/durations for each phase
- Every capability claim needs a "proven by [project name]" reference
- Write as if explaining to a smart non-expert - avoid unnecessary jargon

ANTI-PATTERNS TO AVOID:
- Vague methodology: "industry best practices" (name the actual practice)
- Unsubstantiated claims: "proven methodology" without project evidence
- Tech buzzwords without explanation of client benefit`;
      
    case 'team':
      return `TEAM/EXPERIENCE GUIDELINES:
- Lead with directly relevant project achievements (name, client, outcome)
- Include verifiable credentials: actual certifications, years of experience
- If no specific team members in knowledge base, use role-based descriptions
- Link each team capability to a specific deliverable in this proposal
- Quantify success: "completed 12 projects" not "extensive experience"
- NEVER mention awards without direct relevance to this project

ANTI-PATTERNS TO AVOID:
- Adjective-heavy descriptions: "highly qualified, experienced team"
- Generic qualifications not tied to project needs
- Unverifiable claims about team size or capabilities`;
      
    case 'timeline':
      return `TIMELINE/DELIVERY GUIDELINES:
- Start with final delivery date, then work backwards
- Include specific calendar dates, not "Week 1-2" ranges
- Show parallel work streams and dependencies
- Include buffer time and risk mitigation built-in
- Highlight accelerated delivery if applicable
- Keep under 350 words - timelines should be clear, not verbose

ANTI-PATTERNS TO AVOID:
- Vague milestones: "initial phase completion"
- Missing dependencies between deliverables
- Unrealistic timelines that undermine credibility`;
      
    case 'pricing':
      return `PRICING GUIDELINES:
- Lead with total value delivered, then present investment
- Line items MUST mathematically add up to the total
- Include what's NOT included to set clear expectations
- Justify each line item with deliverable or outcome
- Show payment terms that benefit client cash flow
- State price confidently - no defensive language

ANTI-PATTERNS TO AVOID:
- Line items that don't sum correctly
- Competitor comparisons without verifiable market research
- Defensive justifications: "While this may seem low..."
- Hidden costs or ambiguous scope`;
      
    default:
      return `GENERAL SECTION GUIDELINES:
- Start with the specific client benefit or outcome
- Support every claim with evidence from knowledge base
- Include quantifiable results where available, with source
- Address potential client concerns proactively
- End with clear commitment or next step

ANTI-PATTERNS TO AVOID:
- Generic statements applicable to any company
- Unattributed statistics or percentages
- Repetition of points from other sections`;
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

ANTI-HALLUCINATION PROTOCOL (MANDATORY):
• Statistics require format: "[Number] (Source: [Knowledge Base Entry Title])"
• If no source exists in knowledge base, rewrite as qualitative: "significant improvement" not "45% increase"
• NEVER create specific percentages, dollar amounts, or timeframes not in knowledge base
• When describing team: use actual titles/credentials from knowledge base only
• For vendor partnerships: only name partners explicitly listed in knowledge base
• If information is missing, write around it - don't invent details

ANTI-VERBOSITY PROTOCOL:
• Maximum words by section: Executive (400), Technical (600), Team (400), Timeline (350), Pricing (500), Other (500)
• If a point was made in another section, reference don't repeat: "As noted in [Section Name]..."
• Eliminate: "In order to" → "To", "At this point in time" → "Now", "Due to the fact that" → "Because"
• Remove all instances of: "It is important to note that", "It should be noted that", "As mentioned previously"
• One adjective per noun maximum (not "comprehensive, robust, industry-leading solution")
• Average sentence length: 15-20 words, maximum 30 words per sentence

BANNED VOCABULARY (Using these undermines credibility):
Hyperbolic: catastrophic, bulletproof, ruthless, weaponize, mesmerizing, unparalleled, unprecedented
Vague: various, multiple, numerous, several, extensive, significant (without number attached)
Jargon: synergy, paradigm, leverage (as verb), cutting-edge, state-of-the-art, world-class, best-in-class
Weak: believe, think, feel, hope, try, would be able to, might, perhaps, possibly, arguably

SPECIFICITY REQUIREMENTS:
• Bad: "extensive industry experience" → Good: "8 years delivering video production for state agencies"
• Bad: "Texas vendor partnerships" → Good: "partnership with [Vendor Name] in Austin since 2021" OR omit entirely
• Bad: "proven methodology" → Good: "[Methodology Name] used on 12 government projects since 2019"
• Bad: "competitive pricing" → Good: "$34,500 total investment including all deliverables"
• Bad: "our team of experts" → Good: "[Name], [Title] with [X] years in [Specific Field]"

${strictMode ? `
*** ULTRA-STRICT ANTI-HALLUCINATION MODE ACTIVATED ***

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

REMEMBER: Better to refuse generation than risk any hallucination. When in doubt, always refuse.` : ''}

WRITING STYLE:
- Use persuasive, confident language that demonstrates expertise
- Start immediately with substantive content (no introductions)
- Write as the proposal itself, not about the proposal
- Focus on measurable outcomes and client success
- Use strong action verbs and specific commitments
- End with clear value proposition or next step

FORBIDDEN CONTENT:
- NO meta-commentary about writing process
- NO generic business language or filler phrases  
- NO invented examples or capabilities
- NO section headers or titles in response
- NO references to "knowledge base," "existing sections," or consistency requirements

Generate ONLY the body content for "${sectionTitle}" - concise, evidence-based, and credibility-focused:`;
}