import { ProjectInfo, KnowledgeEntry } from './types.ts';

export function generateAnalysisPrompt(projectInfo: ProjectInfo, knowledgeEntries: KnowledgeEntry[] = []): string {
  const knowledgeContext = knowledgeEntries.length > 0
    ? `Here is relevant information from our Knowledge Base that you should reference:\n${
        knowledgeEntries.map(entry => `${entry.category}: ${entry.title}`).join('\n')
      }`
    : 'No specific knowledge base entries are available for reference.';

  return `Act as an expert RFP analyst.

The company ${projectInfo.business_name || '[Business Name Not Specified]'} is reviewing an RFP from ${projectInfo.client_name || '[Client Name Not Specified]'} titled ${projectInfo.title}.

${knowledgeContext}

Analyze the following RFP document content and provide a structured analysis with these sections:

1. Key Requirements
- Extract and list all major requirements
- Highlight any technical specifications
- Note any mandatory certifications or qualifications

2. Timeline Analysis
- Submission deadline
- Project milestones
- Implementation schedule
- Review periods

3. Evaluation Criteria
- List all evaluation factors
- Note their relative weights if provided
- Highlight key scoring elements

4. Required Response Elements
- List all sections requiring specific responses
- Note any page limits or formatting requirements
- Identify required forms or attachments

5. Risk Assessment
- Identify potential red flags
- Note any ambiguous terms or specifications
- List missing information that needs clarification
- Highlight any challenging requirements

6. Team Assignment Recommendations
- Suggest team members or roles needed for each section
- Note areas where specific expertise is required
- Reference relevant knowledge base entries for each section

Format the analysis clearly with appropriate headers and bullet points. Prioritize actionable insights that will help the team respond effectively.`;
}