
/**
 * Generates an industry-specific prompt for knowledge base content creation
 */
export function generatePrompt(
  topic: string,
  industry: string,
  category: string,
  customPrompt?: string,
  existingContent?: string
): string {
  // Map industry to specialized instructions
  const industryGuidance = getIndustryGuidance(industry);
  
  // Map category to content structure
  const categoryStructure = getCategoryStructure(category);

  // Base prompt template
  const basePrompt = `You are an expert knowledge base content creator specializing in the ${industry} industry. 
  
Create professional, detailed, and actionable content on the topic "${topic}" for a company's internal knowledge base.

## Industry-Specific Guidelines
${industryGuidance}

## Content Structure
${categoryStructure}

## Content Requirements:
- Write in clear, professional business language
- Include practical examples and best practices
- Organize with appropriate headings and subheadings for easy scanning
- Provide actionable advice that can be implemented immediately
- Include relevant details without unnecessary jargon
- Keep content between 500-1000 words for readability

${existingContent ? `## Existing Knowledge Base Context
The following entries already exist in this company's knowledge base. Use them to:
- Maintain consistent terminology and naming conventions used by this organization
- Reference existing processes, team structures, and tools already documented
- Avoid duplicating content that already exists — instead, cross-reference it
- Align with the company's tone, style, and level of detail

${existingContent}
` : ""}
${customPrompt ? `## Additional Instructions From User\n${customPrompt}\n` : ""}

Create the knowledge base entry now:`;

  return basePrompt;
}

/**
 * Returns specialized guidance based on industry
 */
function getIndustryGuidance(industry: string): string {
  const guidanceMap: Record<string, string> = {
    "technology": `
- Reference current technological standards and best practices
- Consider cybersecurity and data privacy implications
- Address scalability and integration concerns
- Include information about common tools and platforms used in tech
- Consider both technical and non-technical users`,
    
    "healthcare": `
- Ensure all content complies with HIPAA regulations
- Include patient safety and quality of care considerations
- Reference evidence-based practices where applicable
- Consider accessibility for patients with diverse needs
- Maintain professional medical terminology with explanations`,
    
    "finance": `
- Ensure compliance with relevant financial regulations (SEC, FINRA, etc.)
- Include risk management considerations
- Discuss documentation and record-keeping requirements
- Address client confidentiality concerns
- Consider both consumer and business finance implications`,
    
    "education": `
- Focus on educational outcomes and student success metrics
- Include accessibility and inclusivity considerations
- Reference current pedagogical approaches
- Address technology integration in learning environments
- Consider compliance with educational regulations (FERPA, etc.)`,
    
    "retail": `
- Focus on customer experience and satisfaction
- Include inventory management best practices
- Address online and offline sales channel coordination
- Reference relevant consumer protection regulations
- Consider seasonal and trend-based considerations`,
    
    "manufacturing": `
- Include safety protocols and OSHA compliance information
- Address quality control and quality assurance processes
- Reference supply chain and logistics considerations
- Include equipment maintenance and operational guidance
- Consider sustainability and waste reduction practices`,
    
    "legal": `
- Ensure accurate citation of relevant laws and regulations
- Include client confidentiality and privilege considerations
- Address risk management and compliance issues
- Reference document retention and security requirements
- Avoid providing specific legal advice in general documents`,
    
    "marketing": `
- Focus on measurable marketing outcomes and KPIs
- Include brand consistency guidelines
- Address omnichannel marketing coordination
- Reference target audience insights and personas
- Consider regulatory compliance (truth in advertising, etc.)`,
    
    "construction": `
- Include safety protocols and compliance with building codes
- Address quality control and inspection processes
- Reference project management and timeline considerations
- Include material specifications and alternatives
- Consider environmental and sustainability factors`,
    
    "hospitality": `
- Focus on guest experience and satisfaction metrics
- Include staff training and service standards
- Address health and safety protocols
- Reference seasonal considerations and planning
- Consider accommodation for special needs guests`,

    "other": `
- Focus on industry best practices and standards
- Include compliance with relevant regulations
- Address quality assurance and process documentation
- Reference stakeholder needs and expectations
- Consider efficiency and effectiveness improvements`
  };
  
  return guidanceMap[industry] || guidanceMap["other"];
}

/**
 * Returns content structure based on knowledge base category
 */
function getCategoryStructure(category: string): string {
  // Convert category to lowercase and remove spaces for comparison
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, '');
  
  const structureMap: Record<string, string> = {
    "procedures": `
- Introduction and purpose
- Prerequisites and required materials
- Step-by-step process instructions
- Troubleshooting common issues
- Quality control checkpoints
- Expected outcomes and success criteria
- Related procedures and resources`,
    
    "policies": `
- Policy statement and purpose
- Scope and applicability
- Detailed policy provisions
- Roles and responsibilities
- Compliance and enforcement
- Exceptions procedure
- Related policies and references
- Review and revision information`,
    
    "templates": `
- Purpose and use cases
- Instructions for completion
- Required fields explanation
- Example of completed template
- Submission and approval process
- Common mistakes to avoid
- Related templates and resources`,
    
    "training": `
- Learning objectives
- Target audience
- Prerequisites
- Training content organized by modules
- Practice exercises or scenarios
- Assessment methods
- Additional resources for continued learning`,
    
    "guides": `
- Purpose and when to use
- Key concepts and terminology
- Detailed instructions or explanations
- Visual aids where applicable
- Tips and best practices
- Common pitfalls to avoid
- References and related resources`,
    
    "faqs": `
- Organization by topic areas
- Clear question phrasing
- Comprehensive answers with examples
- Cross-references to related questions
- Links to more detailed resources
- Contact information for additional help`,
    
    "bestpractices": `
- Executive summary
- Background and context
- Detailed best practices by aspect
- Implementation guidance
- Measurement and success indicators
- Case examples or scenarios
- Resources for more information`,
    
    "reference": `
- Purpose and application
- Key definitions and concepts
- Detailed reference information
- Cross-references to related information
- Sources and authorities
- How to stay updated on changes`,
  };
  
  // Find a matching category or use default
  for (const [key, value] of Object.entries(structureMap)) {
    if (normalizedCategory.includes(key)) {
      return value;
    }
  }
  
  // Default structure
  return `
- Introduction and context
- Main content organized by subtopics
- Key points and takeaways
- Related resources and references
- Next steps or action items`;
}
