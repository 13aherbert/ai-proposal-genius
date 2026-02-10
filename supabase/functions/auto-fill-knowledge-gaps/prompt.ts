/**
 * Generates extraction-focused prompts for auto-filling knowledge base gaps.
 * Unlike the standard generation prompt, this focuses on EXTRACTING real data
 * from existing entries rather than generating generic content.
 */
export function generateExtractionPrompt(
  targetCategory: string,
  existingContent: string,
  industry: string
): string {
  return `You are an expert knowledge base organizer. Your task is to EXTRACT and REORGANIZE information from existing knowledge base entries into a properly structured entry for the category "${targetCategory}".

## Your Goal
Scan ALL the existing knowledge base content below and extract every piece of information relevant to "${targetCategory}". Synthesize it into a single, well-organized entry.

## Critical Rules
1. **EXTRACT REAL DATA** — Use actual names, numbers, qualifications, capabilities, and details found in the existing entries. Do NOT invent or fabricate information.
2. **Mark gaps clearly** — If you find partial information (e.g., a person's name but not their title), include what you found and mark what's missing like this: [ADD: specific detail needed]
3. **Attribute sources** — When you pull information from a specific entry, naturally incorporate it rather than citing the source.
4. **Be comprehensive** — Scan every entry thoroughly. Information relevant to "${targetCategory}" may appear anywhere — in project descriptions, process documents, company overviews, etc.
5. **Professional structure** — Organize the extracted content into a clear, professional format appropriate for "${targetCategory}".

## Industry Context
This is a ${industry} organization. Use appropriate terminology and structure for this industry.

## Category-Specific Extraction Guide
${getCategoryExtractionGuide(targetCategory)}

## Existing Knowledge Base Content
The following is ALL content currently in the knowledge base. Extract everything relevant to "${targetCategory}":

---
${existingContent}
---

## Output Format
Write the entry in professional markdown format with:
- Clear headings and subheadings
- Bullet points for lists of items
- Bold for key names, titles, or important terms
- [ADD: description] markers where information is incomplete
- Content length: 500-1500 words depending on how much relevant data exists

Generate the "${targetCategory}" entry now:`;
}

function getCategoryExtractionGuide(category: string): string {
  const normalized = category.toLowerCase();

  if (normalized.includes("team") || normalized.includes("bio")) {
    return `Look for:
- People's names, titles, and roles mentioned anywhere
- Qualifications, certifications, degrees, or years of experience
- Areas of expertise or specialization
- Project involvement that demonstrates capabilities
- Leadership or management responsibilities
Structure as: Individual bios grouped by department/role, with qualifications and key accomplishments.`;
  }

  if (normalized.includes("technical") || normalized.includes("capabilities")) {
    return `Look for:
- Technologies, tools, platforms, or systems mentioned
- Technical processes or methodologies used
- Infrastructure or architecture descriptions
- Integration capabilities
- Performance metrics or benchmarks
- Certifications or compliance standards
Structure as: Capability areas with detailed descriptions of expertise and tools.`;
  }

  if (normalized.includes("differentiator") || normalized.includes("competitive") || normalized.includes("unique")) {
    return `Look for:
- Unique approaches, methodologies, or processes
- Awards, recognitions, or industry leadership mentions
- Proprietary tools, frameworks, or technologies
- Client success stories or exceptional outcomes
- Market positioning statements
- What sets the organization apart from competitors
Structure as: Key differentiators with supporting evidence from existing content.`;
  }

  if (normalized.includes("value") || normalized.includes("proposition")) {
    return `Look for:
- Benefits delivered to clients or customers
- ROI claims or measurable outcomes
- Problem-solution statements
- Client testimonials or success metrics
- Core promises or commitments
Structure as: Clear value statements supported by evidence and outcomes.`;
  }

  if (normalized.includes("case") || normalized.includes("success") || normalized.includes("portfolio")) {
    return `Look for:
- Project descriptions with outcomes
- Client names and industries served
- Metrics, improvements, or results achieved
- Challenges overcome
- Technologies or approaches used
Structure as: Individual case studies with challenge, approach, and results.`;
  }

  return `Look for any information related to "${category}" including:
- Relevant facts, processes, or descriptions
- People, tools, or resources involved
- Metrics, outcomes, or standards
- Related policies or procedures
Structure as: Organized sections covering all aspects of ${category} found in existing content.`;
}
