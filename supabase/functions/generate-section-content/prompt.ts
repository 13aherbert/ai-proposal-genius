
import { Project } from './types.ts';

export function generatePrompt(
  sectionTitle: string,
  project: Project,
  knowledgeBaseContext: string
): string {
  return `You are writing the "${sectionTitle}" section for a business proposal. ONLY use REAL examples and content from the knowledge base provided below. DO NOT invent, extrapolate, or create ANY content that is not explicitly present in the knowledge base.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. ONLY use real examples and information that exists verbatim in the knowledge base above.
2. If you cannot find specific information in the knowledge base for a topic:
   - DO NOT make up examples or content
   - DO NOT use placeholder text
   - DO NOT mention that information is missing
   - Simply omit that topic entirely and focus on what IS available
3. When using content from the knowledge base:
   - Copy the exact text, numbers, and examples
   - Only make minimal grammatical adjustments for flow
   - Keep all specific details (dates, numbers, names) exactly as they appear
4. Forbidden actions:
   - NO hypothetical examples
   - NO "such as" or similar phrases unless directly quoting
   - NO generalizations about capabilities unless explicitly stated in the knowledge base
   - NO invented metrics or outcomes
5. Required elements (ONLY if they exist in the knowledge base):
   - Use exact project names and details
   - Use real client names and testimonials
   - Use actual metrics and outcomes
   - Use verified credentials and certifications

Write the ${sectionTitle} section now, using EXCLUSIVELY the real content found in the knowledge base above. If certain information is not available, simply focus on what is available without mentioning gaps:`;
}
