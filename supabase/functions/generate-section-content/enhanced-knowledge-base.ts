import { KnowledgeEntry } from "./types.ts";

export interface EnhancedKnowledgeContext {
  contextualSummary: string;
  sectionSpecificExtracts: { [sectionType: string]: string };
  crossReferences: { [concept: string]: string[] };
  synthesizedInsights: string;
}

export function formatEnhancedKnowledgeBaseContext(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): string {
  if (!entries || entries.length === 0) {
    return "No knowledge base entries available.";
  }

  // Enhanced context formatting with intelligent extraction
  const enhancedContext = createEnhancedContext(entries, sectionType, sectionTitle);
  
  let formattedContext = "ENHANCED KNOWLEDGE BASE CONTEXT:\n\n";
  
  // Section-specific content extraction
  formattedContext += `SECTION-SPECIFIC CONTENT FOR "${sectionTitle}":\n`;
  formattedContext += enhancedContext.sectionSpecificExtracts[sectionType] || 'No specific content identified';
  formattedContext += '\n\n';
  
  // Cross-referenced information
  formattedContext += "RELEVANT CROSS-REFERENCES:\n";
  Object.entries(enhancedContext.crossReferences).forEach(([concept, refs]) => {
    if (refs.length > 0) {
      formattedContext += `${concept.toUpperCase()}: ${refs.join('; ')}\n`;
    }
  });
  formattedContext += '\n';
  
  // Synthesized insights
  formattedContext += "CONTEXTUAL INSIGHTS:\n";
  formattedContext += enhancedContext.synthesizedInsights;
  formattedContext += '\n\n';
  
  // Original categorized content (for reference)
  formattedContext += "FULL KNOWLEDGE BASE ENTRIES:\n\n";
  const entriesByCategory = entries.reduce((acc: { [key: string]: KnowledgeEntry[] }, entry) => {
    const category = entry.category.replace(/-/g, ' ').toUpperCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entry);
    return acc;
  }, {});
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]) => {
    formattedContext += `${category}:\n\n`;
    categoryEntries.forEach(entry => {
      formattedContext += `=== ${entry.title} ===\n`;
      if (entry.content) {
        formattedContext += `${entry.content}\n`;
      }
      if (entry.parsed_content) {
        formattedContext += `${entry.parsed_content}\n`;
      }
      formattedContext += '\n';
    });
    formattedContext += '---\n\n';
  });

  return formattedContext;
}

function createEnhancedContext(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): EnhancedKnowledgeContext {
  
  const sectionSpecificExtracts = extractSectionSpecificContent(entries, sectionType, sectionTitle);
  const crossReferences = buildCrossReferences(entries);
  const synthesizedInsights = synthesizeInsights(entries, sectionType);
  const contextualSummary = createContextualSummary(entries);
  
  return {
    contextualSummary,
    sectionSpecificExtracts,
    crossReferences,
    synthesizedInsights
  };
}

function extractSectionSpecificContent(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): { [sectionType: string]: string } {
  
  const extractors: { [key: string]: (entries: KnowledgeEntry[]) => string } = {
    executive: extractExecutiveSummaryContent,
    company: extractCompanyContent,
    technical: extractTechnicalContent,
    team: extractTeamContent,
    pricing: extractPricingContent,
    timeline: extractTimelineContent,
    general: extractGeneralContent
  };
  
  const extractor = extractors[sectionType] || extractors.general;
  const extractedContent = extractor(entries);
  
  return { [sectionType]: extractedContent };
}

function extractExecutiveSummaryContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  // Extract company overview, key achievements, value propositions
  const companyInfo = extractTextAroundKeywords(allContent, [
    'company', 'organization', 'business', 'founded', 'established', 'overview', 'about'
  ]);
  
  const achievements = extractTextAroundKeywords(allContent, [
    'achieved', 'delivered', 'successful', 'won', 'award', 'recognized', 'completed'
  ]);
  
  const valueProps = extractTextAroundKeywords(allContent, [
    'benefit', 'value', 'advantage', 'solution', 'improve', 'enhance', 'deliver'
  ]);
  
  return `Company Overview: ${companyInfo}\n\nKey Achievements: ${achievements}\n\nValue Propositions: ${valueProps}`;
}

function extractCompanyContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const companyDetails = extractTextAroundKeywords(allContent, [
    'company', 'organization', 'business', 'firm', 'corporate', 'founded', 'established',
    'headquarters', 'office', 'history', 'mission', 'vision', 'values'
  ]);
  
  const services = extractTextAroundKeywords(allContent, [
    'services', 'solutions', 'offerings', 'products', 'capabilities', 'expertise'
  ]);
  
  return `Company Information: ${companyDetails}\n\nServices & Capabilities: ${services}`;
}

function extractTechnicalContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const methodologies = extractTextAroundKeywords(allContent, [
    'methodology', 'approach', 'process', 'framework', 'system', 'technique', 'method'
  ]);
  
  const technologies = extractTextAroundKeywords(allContent, [
    'technology', 'software', 'tools', 'platform', 'system', 'technical', 'engineering'
  ]);
  
  const implementation = extractTextAroundKeywords(allContent, [
    'implementation', 'delivery', 'development', 'deployment', 'execute', 'build'
  ]);
  
  return `Methodologies: ${methodologies}\n\nTechnologies: ${technologies}\n\nImplementation Approach: ${implementation}`;
}

function extractTeamContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const teamInfo = extractTextAroundKeywords(allContent, [
    'team', 'staff', 'personnel', 'employees', 'consultants', 'professionals', 'experts'
  ]);
  
  const qualifications = extractTextAroundKeywords(allContent, [
    'certified', 'certification', 'qualified', 'degree', 'licensed', 'credential', 'expert'
  ]);
  
  const experience = extractTextAroundKeywords(allContent, [
    'experience', 'years', 'project', 'client', 'delivered', 'managed', 'led'
  ]);
  
  return `Team Information: ${teamInfo}\n\nQualifications: ${qualifications}\n\nExperience: ${experience}`;
}

function extractPricingContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const pricing = extractTextAroundKeywords(allContent, [
    'cost', 'price', 'rate', 'fee', 'budget', 'investment', '$', 'dollar', 'pricing'
  ]);
  
  const value = extractTextAroundKeywords(allContent, [
    'value', 'roi', 'return', 'savings', 'benefit', 'worth', 'investment'
  ]);
  
  return `Pricing Information: ${pricing}\n\nValue Justification: ${value}`;
}

function extractTimelineContent(entries: KnowledgeEntry[]): string {
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const timelines = extractTextAroundKeywords(allContent, [
    'timeline', 'schedule', 'phase', 'milestone', 'week', 'month', 'day', 'deadline'
  ]);
  
  const delivery = extractTextAroundKeywords(allContent, [
    'delivery', 'completion', 'implementation', 'rollout', 'launch', 'deploy'
  ]);
  
  return `Timeline Information: ${timelines}\n\nDelivery Approach: ${delivery}`;
}

function extractGeneralContent(entries: KnowledgeEntry[]): string {
  // For general sections, provide a balanced overview
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  
  const overview = extractTextAroundKeywords(allContent, [
    'company', 'experience', 'project', 'service', 'solution', 'capability'
  ]);
  
  return `General Information: ${overview}`;
}

function extractTextAroundKeywords(content: string, keywords: string[]): string {
  const sentences = content.split(/[.!?]+/);
  const relevantSentences: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const hasKeyword = keywords.some(keyword => lowerSentence.includes(keyword.toLowerCase()));
    
    if (hasKeyword && sentence.trim().length > 20) {
      relevantSentences.push(sentence.trim());
    }
  });
  
  // Return up to 5 most relevant sentences
  return relevantSentences.slice(0, 5).join('. ') || 'No specific information found';
}

function buildCrossReferences(entries: KnowledgeEntry[]): { [concept: string]: string[] } {
  const crossRefs: { [concept: string]: string[] } = {
    projects: [],
    clients: [],
    technologies: [],
    certifications: [],
    achievements: [],
    processes: []
  };
  
  entries.forEach(entry => {
    const content = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`;
    
    // Extract project references
    const projectMatches = content.match(/project[s]?\s+[^.]{20,100}/gi);
    if (projectMatches) crossRefs.projects.push(...projectMatches.slice(0, 3));
    
    // Extract client references  
    const clientMatches = content.match(/client[s]?\s+[^.]{20,100}/gi);
    if (clientMatches) crossRefs.clients.push(...clientMatches.slice(0, 3));
    
    // Extract technology references
    const techMatches = content.match(/(technology|software|system|platform)\s+[^.]{20,100}/gi);
    if (techMatches) crossRefs.technologies.push(...techMatches.slice(0, 3));
    
    // Extract certification references
    const certMatches = content.match(/(certified|certification|qualified|licensed)\s+[^.]{20,100}/gi);
    if (certMatches) crossRefs.certifications.push(...certMatches.slice(0, 3));
  });
  
  return crossRefs;
}

function synthesizeInsights(entries: KnowledgeEntry[], sectionType: string): string {
  const allContent = entries.map(e => `${e.content || ''} ${e.parsed_content || ''}`).join(' ');
  const wordCount = allContent.trim().split(/\s+/).length;
  
  let insights = `Available knowledge base contains ${entries.length} entries with approximately ${wordCount} words of content. `;
  
  // Analyze content richness
  const hasProjectInfo = /project|client|delivered|completed/i.test(allContent);
  const hasTeamInfo = /team|staff|experience|qualified/i.test(allContent);
  const hasTechInfo = /technical|methodology|process|approach/i.test(allContent);
  const hasCompanyInfo = /company|organization|business|about/i.test(allContent);
  
  if (hasProjectInfo) insights += "Contains project and client experience information. ";
  if (hasTeamInfo) insights += "Includes team capabilities and qualifications. ";
  if (hasTechInfo) insights += "Describes technical approaches and methodologies. ";
  if (hasCompanyInfo) insights += "Provides company background and organizational details. ";
  
  // Section-specific insights
  switch (sectionType) {
    case 'executive':
      insights += "For executive summary: Focus on company strengths, key differentiators, and client value propositions.";
      break;
    case 'technical':
      insights += "For technical sections: Leverage methodology and process information to demonstrate technical competence.";
      break;
    case 'team':
      insights += "For team sections: Highlight individual qualifications, collective experience, and project successes.";
      break;
    default:
      insights += "Content can be adapted for various proposal sections based on specific requirements.";
  }
  
  return insights;
}

function createContextualSummary(entries: KnowledgeEntry[]): string {
  const totalLength = entries.reduce((sum, entry) => {
    return sum + (entry.content?.length || 0) + (entry.parsed_content?.length || 0);
  }, 0);
  
  const categories = [...new Set(entries.map(e => e.category))];
  
  return `Knowledge base summary: ${entries.length} entries across ${categories.length} categories (${categories.join(', ')}). Total content: ${totalLength} characters. Entries contain mix of structured and unstructured information suitable for proposal development.`;
}