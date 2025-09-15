import { KnowledgeEntry } from "./types.ts";

export interface KnowledgeBaseCoverage {
  isAdequate: boolean;
  missingTopics: string[];
  coverageScore: number; // 0-100
  relevantEntries: KnowledgeEntry[];
  recommendations: string[];
}

export function assessKnowledgeBaseCoverage(
  sectionTitle: string,
  knowledgeEntries: KnowledgeEntry[]
): KnowledgeBaseCoverage {
  const sectionType = determineSectionType(sectionTitle);
  const requiredTopics = getRequiredTopicsForSection(sectionType);
  
  // Find relevant knowledge base entries
  const relevantEntries = findRelevantEntries(knowledgeEntries, sectionTitle, requiredTopics);
  
  // Calculate coverage
  const coveredTopics = identifyCoveredTopics(relevantEntries, requiredTopics);
  const missingTopics = requiredTopics.filter(topic => !coveredTopics.includes(topic));
  
  const coverageScore = Math.round((coveredTopics.length / requiredTopics.length) * 100);
  const isAdequate = coverageScore >= 70 && relevantEntries.length >= 2;
  
  const recommendations = generateRecommendations(missingTopics, sectionType);
  
  return {
    isAdequate,
    missingTopics,
    coverageScore,
    relevantEntries,
    recommendations
  };
}

function determineSectionType(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary')) return 'executive';
  if (title.includes('technical') || title.includes('approach') || title.includes('methodology')) return 'technical';
  if (title.includes('team') || title.includes('personnel') || title.includes('experience')) return 'team';
  if (title.includes('timeline') || title.includes('schedule') || title.includes('delivery')) return 'timeline';
  if (title.includes('cost') || title.includes('price') || title.includes('budget')) return 'pricing';
  if (title.includes('company') || title.includes('about') || title.includes('profile')) return 'company';
  if (title.includes('case') || title.includes('reference') || title.includes('example')) return 'case_study';
  
  return 'general';
}

function getRequiredTopicsForSection(sectionType: string): string[] {
  const topicMap: { [key: string]: string[] } = {
    executive: ['company overview', 'value proposition', 'key differentiators', 'outcomes'],
    technical: ['methodology', 'tools', 'processes', 'deliverables', 'quality assurance'],
    team: ['team members', 'experience', 'qualifications', 'past projects', 'expertise'],
    timeline: ['project phases', 'milestones', 'delivery schedule', 'dependencies'],
    pricing: ['pricing model', 'cost structure', 'payment terms', 'value justification'],
    company: ['company history', 'services', 'clients', 'achievements', 'certifications'],
    case_study: ['project examples', 'results', 'testimonials', 'success metrics'],
    general: ['relevant experience', 'capabilities', 'approach']
  };
  
  return topicMap[sectionType] || topicMap.general;
}

function findRelevantEntries(
  knowledgeEntries: KnowledgeEntry[],
  sectionTitle: string,
  requiredTopics: string[]
): KnowledgeEntry[] {
  const searchTerms = [
    ...sectionTitle.toLowerCase().split(' '),
    ...requiredTopics.flatMap(topic => topic.split(' '))
  ];
  
  return knowledgeEntries.filter(entry => {
    const entryText = (entry.title + ' ' + (entry.content || '') + ' ' + (entry.parsed_content || '')).toLowerCase();
    return searchTerms.some(term => entryText.includes(term));
  });
}

function identifyCoveredTopics(relevantEntries: KnowledgeEntry[], requiredTopics: string[]): string[] {
  const allContent = relevantEntries
    .map(entry => (entry.title + ' ' + (entry.content || '') + ' ' + (entry.parsed_content || '')).toLowerCase())
    .join(' ');
  
  return requiredTopics.filter(topic => {
    const topicWords = topic.split(' ');
    return topicWords.some(word => allContent.includes(word));
  });
}

function generateRecommendations(missingTopics: string[], sectionType: string): string[] {
  const recommendations: string[] = [];
  
  if (missingTopics.length > 0) {
    recommendations.push(`Add knowledge base entries covering: ${missingTopics.join(', ')}`);
  }
  
  const sectionSpecificRecommendations: { [key: string]: string[] } = {
    team: ['Add team member profiles with specific experience and qualifications'],
    technical: ['Include detailed methodology documents and process descriptions'],
    pricing: ['Add pricing models, cost breakdowns, and value proposition content'],
    case_study: ['Upload case studies with specific results and client testimonials'],
    company: ['Add company profile information, certifications, and achievements']
  };
  
  if (sectionSpecificRecommendations[sectionType]) {
    recommendations.push(...sectionSpecificRecommendations[sectionType]);
  }
  
  return recommendations;
}

export function validateGeneratedContent(
  content: string,
  knowledgeEntries: KnowledgeEntry[]
): { isValid: boolean; issues: string[]; confidenceScore: number } {
  const issues: string[] = [];
  let confidenceScore = 100;
  
  // Check for hallucination indicators
  const hallucinationPatterns = [
    /\d+(\.\d+)?%(?!\s*(increase|decrease|growth|improvement|reduction|of|from|to))/g, // Unsubstantiated percentages
    /\$[\d,]+(?!\s*(budget|cost|price|value|investment))/g, // Unsubstantiated monetary amounts
    /in \d{4}(?!\s*(we|our|the company))/g, // Unsubstantiated years
    /(industry standard|industry average|typical|generally|usually)/gi, // Generic claims
    /(leading|top|best|premier|award-winning)(?!\s*(as demonstrated|as shown|as evidenced))/gi // Unsupported superlatives
  ];
  
  for (const pattern of hallucinationPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(`Potential unsupported claims found: ${matches.join(', ')}`);
      confidenceScore -= 15;
    }
  }
  
  // Verify claims against knowledge base
  const allKnowledgeText = knowledgeEntries
    .map(entry => entry.title + ' ' + (entry.content || '') + ' ' + (entry.parsed_content || ''))
    .join(' ')
    .toLowerCase();
  
  // Extract specific claims from content
  const specificClaims = extractSpecificClaims(content);
  let unverifiedClaims = 0;
  
  for (const claim of specificClaims) {
    if (!allKnowledgeText.includes(claim.toLowerCase())) {
      unverifiedClaims++;
    }
  }
  
  if (unverifiedClaims > 0) {
    issues.push(`${unverifiedClaims} claims could not be verified against knowledge base`);
    confidenceScore -= unverifiedClaims * 10;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    confidenceScore: Math.max(0, confidenceScore)
  };
}

function extractSpecificClaims(content: string): string[] {
  const claims: string[] = [];
  
  // Extract sentences with specific numbers, dates, or achievements
  const sentences = content.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    if (
      /\d+/.test(sentence) || // Contains numbers
      /\b(certified|award|accredited|experienced|years|clients|projects)\b/i.test(sentence) // Contains specific claim words
    ) {
      claims.push(sentence.trim());
    }
  }
  
  return claims;
}