import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string,
  existingSections?: Array<{section_title: string, content: string}>
): string {
  const isCostRelatedSection = sectionTitle.toLowerCase().includes('cost') || 
    sectionTitle.toLowerCase().includes('price') || 
    sectionTitle.toLowerCase().includes('budget') ||
    sectionTitle.toLowerCase().includes('financial');

  const basePrompt = `You are writing content for the "${sectionTitle}" section of a business proposal.`;

  // Extract key information from existing sections for consistency
  let consistencyContext = '';
  if (existingSections && existingSections.length > 0) {
    consistencyContext = `\n\nEXISTING SECTIONS FOR CONSISTENCY REFERENCE:
This proposal already contains the following sections. You MUST maintain consistency with any pricing, timelines, company information, project scope, deliverables, or other key details mentioned in these existing sections:

`;
    
    existingSections.forEach(section => {
      consistencyContext += `=== ${section.section_title} ===\n${section.content}\n\n`;
    });

    consistencyContext += `\nCONSISTENCY REQUIREMENTS:
- If pricing information exists in any existing section, use the EXACT same pricing structure and amounts
- If project timelines are mentioned, maintain the same schedule and milestones
- If company capabilities or team information is referenced, be consistent with those details
- If project scope or deliverables are defined, align your content with those specifications
- If contact information, company names, or client details are mentioned, use identical information
- Maintain the same tone, style, and level of detail as existing sections
- Never contradict information already established in other sections

`;
  }

  const costSpecificInstructions = isCostRelatedSection ? `
For this cost-related section:
1. FIRST, check existing sections for any pricing or cost information and use those EXACT figures
2. If specific cost information exists in existing sections OR the knowledge base:
   - Use those exact numbers and pricing structures
   - Maintain any specific payment terms or conditions mentioned
   - Include any volume discounts or special pricing arrangements
3. If NO cost information is found in existing sections or the knowledge base:
   - You MUST respond with: "This section requires pricing information in the Knowledge Base. Please add specific pricing details, service rates, or cost structures to generate accurate pricing content."
   - DO NOT generate estimated pricing without knowledge base data` : '';

  return `${basePrompt}

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}${consistencyContext}

${costSpecificInstructions}

STRICT CONTENT GENERATION RULES:
1. You ARE the proposal content itself - write directly as the proposal section
2. NEVER include meta-commentary, introductory phrases, or explanations about your process
3. FORBIDDEN PHRASES - NEVER use any of these:
   - "Here is the [section name]..."
   - "Based on the knowledge base..."
   - "Using the provided information..."
   - "This section covers..."
   - "The following content..."
   - "According to the knowledge base..."
   - "From the information provided..."
   - "Below is the content for..."
   - "As mentioned in other sections..."
   - "Consistent with previous sections..."
   - Any reference to "knowledge base", "provided information", "existing sections", "consistency", or generation process

4. WRITE STYLE:
   - Start immediately with substantive content
   - Write as if you are the proposal document speaking directly
   - Use professional business language appropriate for the section
   - Be authoritative and confident in tone
   - Focus entirely on the client's needs and your business's solutions

5. CONTENT REQUIREMENTS - CRITICAL RULE: KNOWLEDGE BASE ONLY:
   - You MUST ONLY use information that exists explicitly in the knowledge base
   - If specific information doesn't exist in the knowledge base, you MUST respond with:
     "This section requires more specific information in the Knowledge Base. Please add relevant content about [specific topic needed] to generate accurate proposal content."
   - ABSOLUTELY FORBIDDEN TO CREATE:
     * Any examples, statistics, or content not in the knowledge base
     * Past project references unless explicitly documented
     * Client testimonials or case studies unless in knowledge base
     * Company capabilities not specifically listed
     * Team member names or qualifications not documented
     * Timeline estimates not based on knowledge base data
     * Technical specifications not provided in knowledge base
     * Service offerings not explicitly documented
   - When using knowledge base content:
     * Copy exact text, numbers, and examples verbatim
     * Make only minimal grammatical adjustments for flow
     * Keep all specific details exactly as they appear
     * Quote directly from knowledge base entries when possible
   - If the knowledge base lacks sufficient information for ANY part of a section:
     * Do NOT fill gaps with generic content
     * State exactly what information is missing
     * Request specific knowledge base additions needed

6. CONSISTENCY REQUIREMENTS:
   - Maintain absolute consistency with all existing sections
   - Use identical pricing, timelines, and project details
   - Never contradict previously established information
   - Align your content tone and detail level with existing sections

7. ABSOLUTELY FORBIDDEN:
   - NO hypothetical examples or case studies
   - NO references to non-existent past projects  
   - NO invented client testimonials or experiences
   - NO "such as" phrases unless directly quoting knowledge base
   - NO generalizations about capabilities unless explicitly stated in knowledge base
   - NO section titles, headers, or headings in your response
   - NO markdown headers (# ## ###)
   - NO references to the section name "${sectionTitle}" as a header
   - NO references to consistency requirements or existing sections in your content

CRITICAL FORMATTING REQUIREMENT:
- Start immediately with the content body - no introductions or headers
- Your response should be pure proposal content that can be placed directly under the section title
- Write as if the reader is already looking at the "${sectionTitle}" section

Write ONLY the body content for the ${sectionTitle} section now. Be the proposal itself, not a description of the proposal:`;
}