import { KnowledgeEntry } from "./types.ts";

export interface ExtractedConcepts {
  companyInfo: string[];
  teamExperience: string[];
  processes: string[];
  projects: string[];
  qualifications: string[];
  technologies: string[];
  achievements: string[];
  timelines: string[];
  costs: string[];
}

export interface ContextualContent {
  companyOverview: string;
  teamCapabilities: string;
  methodologies: string;
  pastProjects: string;
  certifications: string;
}

export interface IntelligentCoverage {
  coverageScore: number;
  contextualContent: ContextualContent;
  extractedConcepts: ExtractedConcepts;
}

export function analyzeContentIntelligently(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): KnowledgeEntry[] {
  // Instead of rigid keyword matching, analyze content semantically
  const sectionIntents = getSectionIntents(sectionType);
  
  return entries.filter(entry => {
    const content = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
    
    // Check if this entry contains information relevant to the section intent
    return sectionIntents.some(intent => {
      return assessContentRelevance(content, intent, sectionTitle);
    });
  });
}

function getSectionIntents(sectionType: string): string[] {
  const intentMap: { [key: string]: string[] } = {
    executive: ['overview', 'value_proposition', 'benefits', 'outcomes'],
    technical: ['methodology', 'processes', 'approach', 'solutions'],
    team: ['experience', 'qualifications', 'expertise', 'personnel'],
    timeline: ['schedule', 'delivery', 'phases', 'milestones'],
    pricing: ['costs', 'investment', 'value', 'rates'],
    company: ['about', 'organization', 'history', 'capabilities'],
    general: ['company', 'experience', 'approach', 'value']
  };
  
  return intentMap[sectionType] || intentMap.general;
}

function assessContentRelevance(content: string, intent: string, sectionTitle: string): boolean {
  const relevancePatterns: { [key: string]: string[] } = {
    overview: [
      'company', 'organization', 'firm', 'business', 'about', 'founded', 'established',
      'mission', 'vision', 'overview', 'profile', 'background', 'history'
    ],
    value_proposition: [
      'benefit', 'value', 'advantage', 'solution', 'outcome', 'result', 'success',
      'deliver', 'achieve', 'improve', 'enhance', 'optimize', 'save', 'reduce'
    ],
    methodology: [
      'process', 'approach', 'method', 'methodology', 'framework', 'system',
      'procedure', 'technique', 'strategy', 'implementation', 'delivery'
    ],
    experience: [
      'experience', 'project', 'client', 'year', 'completed', 'delivered',
      'managed', 'led', 'implemented', 'worked', 'case study', 'portfolio'
    ],
    qualifications: [
      'certified', 'certification', 'qualification', 'degree', 'licensed',
      'credential', 'expert', 'specialist', 'professional', 'trained'
    ],
    costs: [
      'cost', 'price', 'rate', 'fee', 'budget', 'investment', 'dollar',
      'payment', 'billing', 'hourly', 'fixed', 'estimate'
    ],
    schedule: [
      'timeline', 'schedule', 'phase', 'milestone', 'delivery', 'duration',
      'week', 'month', 'day', 'deadline', 'completion', 'start', 'finish'
    ]
  };

  const patterns = relevancePatterns[intent] || [];
  const matchCount = patterns.filter(pattern => content.includes(pattern)).length;
  
  // More flexible matching - even a few matches indicate relevance
  return matchCount >= 2 || content.length > 5000; // Large documents likely contain relevant info
}

export function calculateIntelligentCoverage(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string,
  totalContent: number
): IntelligentCoverage {
  const extractedConcepts = extractConceptsFromEntries(entries);
  const contextualContent = extractContextualContent(entries, sectionType);
  
  // Calculate coverage based on extracted concepts and contextual understanding
  let coverageScore = 0;
  
  // Base score from having any relevant content (30%)
  if (entries.length > 0) {
    coverageScore += Math.min(entries.length * 15, 30);
  }
  
  // Content volume score (20%)
  if (totalContent > 1000) {
    coverageScore += Math.min((totalContent / 10000) * 20, 20);
  }
  
  // Concept extraction score (30%)
  const conceptScore = calculateConceptCoverage(extractedConcepts, sectionType);
  coverageScore += conceptScore;
  
  // Contextual relevance score (20%)
  const contextualScore = calculateContextualScore(contextualContent, sectionType);
  coverageScore += contextualScore;
  
  return {
    coverageScore: Math.min(coverageScore, 100),
    contextualContent,
    extractedConcepts
  };
}

function extractConceptsFromEntries(entries: KnowledgeEntry[]): ExtractedConcepts {
  const concepts: ExtractedConcepts = {
    companyInfo: [],
    teamExperience: [],
    processes: [],
    projects: [],
    qualifications: [],
    technologies: [],
    achievements: [],
    timelines: [],
    costs: []
  };
  
  entries.forEach(entry => {
    const content = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
    
    // Extract company information
    const companyMatches = content.match(/(founded|established|company|organization|business|firm).{0,100}/gi);
    if (companyMatches) concepts.companyInfo.push(...companyMatches);
    
    // Extract experience and project information
    const projectMatches = content.match(/(project|client|delivered|completed|managed|led).{0,100}/gi);
    if (projectMatches) concepts.projects.push(...projectMatches);
    
    // Extract qualifications
    const qualMatches = content.match(/(certified|certification|degree|licensed|qualified|expert).{0,100}/gi);
    if (qualMatches) concepts.qualifications.push(...qualMatches);
    
    // Extract processes and methodologies
    const processMatches = content.match(/(process|methodology|approach|framework|system).{0,100}/gi);
    if (processMatches) concepts.processes.push(...processMatches);
    
    // Extract achievements and results
    const achievementMatches = content.match(/(achieved|delivered|successful|improved|reduced|increased|won|award).{0,100}/gi);
    if (achievementMatches) concepts.achievements.push(...achievementMatches);
    
    // Extract timeline information
    const timelineMatches = content.match(/(\d+\s+(?:days?|weeks?|months?|years?)|timeline|schedule|phase).{0,100}/gi);
    if (timelineMatches) concepts.timelines.push(...timelineMatches);
    
    // Extract cost information  
    const costMatches = content.match(/(\$[\d,]+|cost|price|budget|investment|rate|fee).{0,100}/gi);
    if (costMatches) concepts.costs.push(...costMatches);
  });
  
  return concepts;
}

function extractContextualContent(entries: KnowledgeEntry[], sectionType: string): ContextualContent {
  const allContent = entries.map(entry => 
    `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`
  ).join(' ');
  
  return {
    companyOverview: extractRelevantText(allContent, ['company', 'organization', 'about', 'overview', 'business']),
    teamCapabilities: extractRelevantText(allContent, ['team', 'staff', 'experience', 'expert', 'qualified']),
    methodologies: extractRelevantText(allContent, ['process', 'methodology', 'approach', 'framework']),
    pastProjects: extractRelevantText(allContent, ['project', 'client', 'delivered', 'completed', 'case']),
    certifications: extractRelevantText(allContent, ['certified', 'certification', 'qualified', 'licensed'])
  };
}

function extractRelevantText(content: string, keywords: string[]): string {
  const sentences = content.split(/[.!?]+/);
  const relevantSentences = sentences.filter(sentence => 
    keywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  return relevantSentences.slice(0, 5).join('. '); // Limit to 5 most relevant sentences
}

function calculateConceptCoverage(concepts: ExtractedConcepts, sectionType: string): number {
  const sectionConceptMap: { [key: string]: (keyof ExtractedConcepts)[] } = {
    executive: ['companyInfo', 'achievements', 'projects'],
    technical: ['processes', 'technologies', 'achievements'],
    team: ['teamExperience', 'qualifications', 'projects'],
    timeline: ['timelines', 'processes', 'projects'],
    pricing: ['costs', 'projects', 'achievements'],
    company: ['companyInfo', 'achievements', 'projects'],
    general: ['companyInfo', 'projects', 'achievements']
  };
  
  const relevantConcepts = sectionConceptMap[sectionType] || sectionConceptMap.general;
  const conceptCounts = relevantConcepts.map(concept => concepts[concept].length);
  const totalConcepts = conceptCounts.reduce((sum, count) => sum + count, 0);
  
  // Score based on concept richness
  return Math.min((totalConcepts / 10) * 30, 30);
}

function calculateContextualScore(contextual: ContextualContent, sectionType: string): number {
  const sectionContentMap: { [key: string]: (keyof ContextualContent)[] } = {
    executive: ['companyOverview', 'pastProjects'],
    technical: ['methodologies', 'pastProjects'],
    team: ['teamCapabilities', 'certifications'],
    company: ['companyOverview', 'certifications'],
    general: ['companyOverview', 'pastProjects']
  };
  
  const relevantContent = sectionContentMap[sectionType] || sectionContentMap.general;
  const contentLengths = relevantContent.map(content => contextual[content].length);
  const totalLength = contentLengths.reduce((sum, length) => sum + length, 0);
  
  return Math.min((totalLength / 1000) * 20, 20);
}

export function assessSectionRequirementsIntelligently(
  sectionType: string, 
  entries: KnowledgeEntry[], 
  concepts: ExtractedConcepts
): { areMet: boolean; missing: string[] } {
  const requirements: { [key: string]: string[] } = {
    executive: ['company information', 'value proposition'],
    technical: ['methodology or approach', 'technical capabilities'],
    team: ['experience or qualifications', 'team information'],
    pricing: ['cost information', 'value justification'],
    timeline: ['timeline or schedule information', 'delivery approach'],
    company: ['company overview', 'capabilities'],
    general: ['relevant content']
  };
  
  const sectionReqs = requirements[sectionType] || requirements.general;
  const missing: string[] = [];
  
  // Much more flexible requirement checking
  sectionReqs.forEach(req => {
    let isMet = false;
    
    if (req.includes('company') && (concepts.companyInfo.length > 0 || entries.length > 0)) {
      isMet = true;
    } else if (req.includes('experience') && (concepts.projects.length > 0 || concepts.teamExperience.length > 0)) {
      isMet = true;
    } else if (req.includes('technical') && (concepts.processes.length > 0 || concepts.technologies.length > 0)) {
      isMet = true;
    } else if (req.includes('cost') && concepts.costs.length > 0) {
      isMet = true;
    } else if (req.includes('timeline') && concepts.timelines.length > 0) {
      isMet = true;
    } else if (req.includes('relevant') && entries.length > 0) {
      isMet = true;
    }
    
    if (!isMet) {
      missing.push(req);
    }
  });
  
  return {
    areMet: missing.length === 0,
    missing
  };
}

export function identifyMissingTopicsIntelligently(
  sectionType: string, 
  concepts: ExtractedConcepts,
  contextual: ContextualContent
): string[] {
  const missing: string[] = [];
  
  // Much more reasonable missing topic identification
  switch (sectionType) {
    case 'executive':
      if (concepts.companyInfo.length === 0 && contextual.companyOverview.length < 100) {
        missing.push('company overview');
      }
      break;
    case 'technical':
      if (concepts.processes.length === 0 && contextual.methodologies.length < 50) {
        missing.push('methodology');
      }
      break;
    case 'team':
      if (concepts.qualifications.length === 0 && contextual.teamCapabilities.length < 50) {
        missing.push('team qualifications');
      }
      break;
    case 'pricing':
      if (concepts.costs.length === 0) {
        missing.push('cost information');
      }
      break;
    case 'timeline':
      if (concepts.timelines.length === 0) {
        missing.push('timeline information');
      }
      break;
  }
  
  return missing;
}

export function generateIntelligentRecommendations(
  sectionType: string, 
  missingTopics: string[], 
  entriesCount: number,
  contentVolume: number,
  concepts: ExtractedConcepts
): string[] {
  const recommendations: string[] = [];
  
  if (missingTopics.length > 0) {
    recommendations.push(`Consider adding more specific information about: ${missingTopics.join(', ')}`);
  }
  
  if (entriesCount === 0) {
    recommendations.push('Add at least one knowledge base entry with relevant project information');
  }
  
  if (contentVolume < 500) {
    recommendations.push('Existing entries could be enhanced with more detailed information');
  }
  
  // Provide constructive, actionable feedback
  switch (sectionType) {
    case 'team':
      if (concepts.qualifications.length === 0) {
        recommendations.push('Add team member profiles, certifications, or project experience details');
      }
      break;
    case 'technical':
      if (concepts.processes.length === 0) {
        recommendations.push('Include information about your technical approach, processes, or methodologies');
      }
      break;
    case 'pricing':
      if (concepts.costs.length === 0) {
        recommendations.push('Add pricing information, cost structures, or project budgets');
      }
      break;
  }
  
  return recommendations;
}