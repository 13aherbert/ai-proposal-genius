
import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  const isCostRelatedSection = sectionTitle.toLowerCase().includes('cost') || 
    sectionTitle.toLowerCase().includes('price') || 
    sectionTitle.toLowerCase().includes('budget') ||
    sectionTitle.toLowerCase().includes('financial');

  const basePrompt = `You are writing content for the "${sectionTitle}" section of a business proposal.`;

  const costSpecificInstructions = isCostRelatedSection ? `
For this cost-related section:
1. FIRST, search the knowledge base for any relevant pricing, cost structures, or financial information.
2. If specific cost information exists in the knowledge base:
   - Use those exact numbers and pricing structures
   - Maintain any specific payment terms or conditions mentioned
   - Include any volume discounts or special pricing arrangements
3. If NO cost information is found in the knowledge base:
   - Draw from your knowledge of industry standards and competitive market rates
   - Consider the project scope and requirements
   - Propose reasonable cost structures that align with industry practices
   - Ensure pricing reflects market value while remaining competitive
   - Include standard payment terms and conditions
   - DO NOT invent or reference any past projects, clients, or case studies
   - Only discuss pricing structures and terms in general industry terms
   - Focus on the specific requirements of THIS project only` : '';

  return `${basePrompt}

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

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
   - Any reference to "knowledge base", "provided information", or generation process

4. WRITE STYLE:
   - Start immediately with substantive content
   - Write as if you are the proposal document speaking directly
   - Use professional business language appropriate for the section
   - Be authoritative and confident in tone
   - Focus entirely on the client's needs and your business's solutions

5. CONTENT REQUIREMENTS:
   - For non-cost sections: ONLY use real examples and information that exists verbatim in the knowledge base
   - If specific information doesn't exist in the knowledge base:
     * DO NOT make up examples or content
     * DO NOT use placeholder text
     * Simply omit that topic and focus on available information
   - When using knowledge base content:
     * Copy exact text, numbers, and examples
     * Make only minimal grammatical adjustments for flow
     * Keep all specific details exactly as they appear

6. ABSOLUTELY FORBIDDEN:
   - NO hypothetical examples or case studies (except for cost sections without knowledge base data)
   - NO references to non-existent past projects
   - NO invented client testimonials or experiences
   - NO "such as" phrases unless directly quoting knowledge base
   - NO generalizations about capabilities unless explicitly stated in knowledge base
   - NO section titles, headers, or headings in your response
   - NO markdown headers (# ## ###)
   - NO references to the section name "${sectionTitle}" as a header

CRITICAL FORMATTING REQUIREMENT:
- Start immediately with the content body - no introductions or headers
- Your response should be pure proposal content that can be placed directly under the section title
- Write as if the reader is already looking at the "${sectionTitle}" section

Write ONLY the body content for the ${sectionTitle} section now. Be the proposal itself, not a description of the proposal:`;
}
