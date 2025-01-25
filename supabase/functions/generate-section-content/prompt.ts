import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  return `You are writing the "${sectionTitle}" section for a business proposal. You MUST incorporate relevant information from the knowledge base provided below. This is CRITICAL - use the knowledge base content to support and enhance your response.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. You MUST use information from the knowledge base above. This is your primary source of content.
2. Look for and use:
   - Company boilerplates and standard language
   - Past project examples and case studies
   - Relevant pricing information
   - Legal disclaimers
   - Industry benchmarks
   - Competitive insights
3. When you find relevant content in the knowledge base, incorporate it directly into your response.
4. If you find boilerplate text or standard language, use it as-is or adapt it minimally to fit this proposal.
5. Write in a professional, business proposal style.
6. Focus on demonstrating:
   - Understanding of the client's needs
   - Your organization's relevant experience (from the knowledge base)
   - Past successes in similar projects (from the knowledge base)
   - Competitive advantages (from the knowledge base)
7. If specific types of information are missing from the knowledge base, continue writing with what IS available rather than noting what's missing.

Write the ${sectionTitle} section now, using the knowledge base content provided above:`;
}