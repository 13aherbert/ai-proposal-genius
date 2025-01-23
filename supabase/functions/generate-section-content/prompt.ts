import { Project } from './types';

/**
 * Generates the AI prompt for content generation
 * @param sectionTitle - Title of the section to generate
 * @param project - Project details
 * @param knowledgeBaseContext - Formatted knowledge base context
 * @returns Complete prompt string
 */
export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  return `\n\nHuman: You are writing the "${sectionTitle}" section for a business proposal. You MUST ONLY use the knowledge base information provided below to create this section. DO NOT make up or infer any information that is not explicitly stated in the knowledge base.

Project Information:
- Title: ${project.title}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. You MUST ONLY use information that is explicitly stated in the knowledge base above. DO NOT make up or infer any information.
2. If you cannot find specific information in the knowledge base for a point you want to make, DO NOT include that point.
3. For every statement you make, you must be able to point to the exact source in the knowledge base.
4. Use the exact terminology and phrasing from the knowledge base to maintain accuracy.
5. If relevant boilerplate text exists in the knowledge base, use it verbatim.
6. If relevant pricing information exists in the knowledge base, use it exactly as stated.
7. If relevant legal disclaimers exist in the knowledge base, include them without modification.
8. Write in active voice and maintain a formal, professional tone.

Write the section now, using ONLY the information provided above:\n\nAssistant:`;
}