import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  return `You are writing the "${sectionTitle}" section for a business proposal. Your primary task is to write content using the knowledge base information provided below. DO NOT create placeholders - you must use the actual content provided.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. DO NOT create placeholders or mention "inserting content from knowledge base" - actually use the content directly.
2. When you find relevant content in the knowledge base, incorporate it verbatim or with minimal adaptation.
3. If specific content is not available in the knowledge base, write naturally without mentioning the missing information.
4. Focus on:
   - Using actual examples and case studies from the knowledge base
   - Including real metrics and outcomes from past projects
   - Incorporating genuine testimonials and references
   - Using verified company credentials and certifications
5. Write in a professional, business proposal style.
6. Maintain a confident tone based on real achievements and capabilities documented in the knowledge base.

Write the ${sectionTitle} section now, using ONLY the actual content from the knowledge base provided above. Do not create placeholders or reference sections that should be inserted later:`;
}