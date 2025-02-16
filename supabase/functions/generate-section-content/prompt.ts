
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

  const basePrompt = `You are writing the "${sectionTitle}" section for a business proposal.`;

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

STRICT INSTRUCTIONS:
1. For non-cost sections, ONLY use real examples and information that exists verbatim in the knowledge base above.
2. If you cannot find specific information in the knowledge base for a topic:
   - DO NOT make up examples or content
   - DO NOT use placeholder text
   - DO NOT mention that information is missing
   - Simply omit that topic entirely and focus on what IS available
3. When using content from the knowledge base:
   - Copy the exact text, numbers, and examples
   - Only make minimal grammatical adjustments for flow
   - Keep all specific details (dates, numbers, names) exactly as they appear
4. Forbidden actions (even in cost sections):
   - NO hypothetical examples or case studies
   - NO references to non-existent past projects
   - NO invented client testimonials or experiences
   - NO "such as" or similar phrases unless directly quoting
   - NO generalizations about capabilities unless explicitly stated in the knowledge base
5. Required elements (ONLY if they exist in the knowledge base):
   - Use exact project names and details
   - Use real client names and testimonials
   - Use actual metrics and outcomes
   - Use verified credentials and certifications

Write the ${sectionTitle} section now. For cost sections without knowledge base data, create a competitive market-aligned proposal WITHOUT inventing past work examples. For all other sections, use EXCLUSIVELY the real content found in the knowledge base above:`;
}
