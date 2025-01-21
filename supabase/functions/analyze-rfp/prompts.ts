import { ProjectInfo, KnowledgeEntry } from './types.ts';

export function generateAnalysisPrompt(projectInfo: ProjectInfo, knowledgeEntries: KnowledgeEntry[] = []): string {
  return `Act as an expert RFP analyst.

Analyze the following RFP document for ${projectInfo.business_name || '[Business Name Not Specified]'} from ${projectInfo.client_name || '[Client Name Not Specified]'} titled ${projectInfo.title}.

Provide a concise, structured analysis focusing only on these key elements:

1. Key Requirements
- List the most critical requirements (maximum 5)
- Note any mandatory certifications or qualifications
- Highlight technical specifications if present

2. Timeline & Deadlines
- Submission deadline (exact date if specified)
- Key project milestones
- Implementation schedule

3. Evaluation Criteria
- List main evaluation factors
- Note scoring weights if provided
- Highlight any pass/fail criteria

4. Required Response Elements
- List mandatory sections requiring responses
- Note any page limits or formatting requirements
- List required forms or attachments

5. Risk Assessment
- Identify potential red flags (maximum 3)
- List any ambiguous terms or specifications
- Note any missing critical information

Format the response in a clear, bullet-point structure. Keep each section brief and actionable. Focus on the most important elements that will impact the bid decision and response strategy.`;
}