import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  return `You are writing the "${sectionTitle}" section for a business proposal. You MUST use the knowledge base information provided below to create this section. DO NOT make up or infer any information that is not explicitly stated in the knowledge base.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. You MUST use information from the knowledge base above to write this section.
2. If you find relevant boilerplate text, pricing information, or legal disclaimers in the knowledge base, use them exactly as stated.
3. Only include information that is explicitly stated in the knowledge base or project details.
4. Write in a professional, business proposal style.
5. Focus on demonstrating understanding of the client's needs and how your organization's experience (from the knowledge base) addresses them.
6. If you cannot find enough relevant information in the knowledge base, acknowledge this and suggest what additional information would be helpful.

Write the ${sectionTitle} section now, using ONLY the information provided above:`;
}