import { KnowledgeEntry } from "./types.ts";
import { 
  analyzeContentIntelligently, 
  calculateIntelligentCoverage, 
  assessSectionRequirementsIntelligently,
  identifyMissingTopicsIntelligently,
  generateIntelligentRecommendations,
  ExtractedConcepts,
  ContextualContent
} from "./intelligent-analysis.ts";

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
  // Enhanced: Filter entries with meaningful content using intelligent analysis
  const meaningfulEntries = knowledgeEntries.filter(entry => {
    const totalContent = (entry.content || '') + ' ' + (entry.parsed_content || '');
    const cleanContent = totalContent.trim();
    
    // Require substantial content but be more flexible
    if (cleanContent.length < 50) return false;
    
    // Enhanced placeholder detection - less restrictive
    const placeholderPatterns = [
      /^placeholder$/gi,
      /^lorem ipsum/gi,
      /^sample text$/gi,
      /^todo$/gi,
      /^tbd$/gi,
      /^coming soon$/gi,
      /^\s*-\s*$/gm, // Just dashes
      /^\s*\*\s*$/gm, // Just asterisks
    ];
    
    const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(cleanContent));
    if (hasPlaceholders) return false;
    
    return true; // Much more permissive - let content analysis determine relevance
  });

  if (meaningfulEntries.length === 0) {
    return {
      isAdequate: false,
      coverageScore: 0,
      missingTopics: ['All content areas - no meaningful knowledge base entries found'],
      relevantEntries: [],
      recommendations: [
        'CRITICAL: No meaningful knowledge base entries detected',
        'Add at least 1 detailed entry with relevant project information',
        'Existing entries appear to be empty or placeholder content'
      ]
    };
  }

  const sectionType = determineSectionType(sectionTitle);
  
  // ENHANCED: Intelligent content analysis and extraction
  const relevantEntries = analyzeContentIntelligently(meaningfulEntries, sectionType, sectionTitle);
  
  // Calculate total content volume for relevant entries
  const totalRelevantContent = relevantEntries.reduce((total, entry) => {
    return total + (entry.content?.trim().length || 0) + (entry.parsed_content?.trim().length || 0);
  }, 0);

  // Enhanced coverage calculation using intelligent analysis
  const { coverageScore, contextualContent, extractedConcepts } = calculateIntelligentCoverage(
    relevantEntries, 
    sectionType, 
    sectionTitle,
    totalRelevantContent
  );
  
  // More reasonable adequacy check - focus on content quality over rigid metrics
  const minCoverageThreshold = 70; // Reduced from 95% to 70%
  const hasSubstantialContent = totalRelevantContent >= 1000; // Lower threshold
  const hasRelevantEntries = relevantEntries.length >= 1; // Much more reasonable
  
  // Enhanced section requirements using intelligent analysis  
  const sectionRequirements = assessSectionRequirementsIntelligently(
    sectionType, 
    relevantEntries, 
    extractedConcepts
  );
  
  const isAdequate = coverageScore >= minCoverageThreshold && 
                    hasSubstantialContent &&
                    hasRelevantEntries &&
                    sectionRequirements.areMet;
  
  // Generate intelligent recommendations based on content analysis
  const missingTopics = identifyMissingTopicsIntelligently(
    sectionType, 
    extractedConcepts,
    contextualContent
  );
  
  const recommendations = generateIntelligentRecommendations(
    sectionType, 
    missingTopics, 
    relevantEntries.length, 
    totalRelevantContent,
    extractedConcepts
  );
  
  return {
    isAdequate,
    missingTopics,
    coverageScore: Math.round(coverageScore),
    relevantEntries,
    recommendations
  };
}

function determineSectionType(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary') || title.includes('overview')) return 'executive';
  if (title.includes('technical') || title.includes('approach') || title.includes('methodology') || title.includes('solution')) return 'technical';
  if (title.includes('team') || title.includes('personnel') || title.includes('experience') || title.includes('staff')) return 'team';
  if (title.includes('timeline') || title.includes('schedule') || title.includes('delivery') || title.includes('milestones')) return 'timeline';
  if (title.includes('cost') || title.includes('price') || title.includes('budget') || title.includes('investment')) return 'pricing';
  if (title.includes('company') || title.includes('about') || title.includes('profile') || title.includes('organization')) return 'company';
  if (title.includes('case') || title.includes('reference') || title.includes('example') || title.includes('study')) return 'case_study';
  
  return 'general';
}

function getSemanticKeywords(sectionType: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    executive: [
      'company', 'business', 'organization', 'firm', 'about us', 'overview',
      'mission', 'vision', 'values', 'experience', 'expertise', 'capabilities',
      'services', 'solutions', 'value', 'benefits', 'why choose', 'competitive advantage',
      'differentiator', 'outcomes', 'success', 'results', 'achievement'
    ],
    technical: [
      'process', 'methodology', 'approach', 'technique', 'method', 'procedure',
      'technology', 'tools', 'systems', 'framework', 'implementation', 'delivery',
      'best practices', 'standards', 'quality', 'testing', 'development',
      'solution', 'technical', 'engineering', 'architecture'
    ],
    team: [
      'team', 'staff', 'personnel', 'employees', 'consultants', 'experts',
      'qualifications', 'experience', 'expertise', 'skills', 'certifications',
      'background', 'biography', 'resume', 'credentials', 'leadership',
      'professional', 'specialist', 'years', 'project', 'role'
    ],
    timeline: [
      'timeline', 'schedule', 'phases', 'milestones', 'deliverables', 'duration',
      'project plan', 'implementation', 'deployment', 'rollout', 'delivery',
      'stages', 'steps', 'workflow', 'process flow', 'calendar', 'deadline'
    ],
    pricing: [
      'pricing', 'cost', 'rates', 'fees', 'budget', 'investment', 'price',
      'billing', 'payment', 'hourly', 'fixed', 'retainer', 'proposal cost',
      'value', 'roi', 'return', 'savings', 'financial'
    ],
    company: [
      'company', 'business', 'organization', 'firm', 'corporate', 'about',
      'history', 'founded', 'established', 'headquarters', 'office',
      'services', 'clients', 'customers', 'portfolio', 'awards', 'recognition'
    ],
    case_study: [
      'project', 'case', 'example', 'study', 'client', 'customer', 'success',
      'results', 'outcome', 'testimonial', 'reference', 'achievement',
      'implementation', 'solution', 'challenge', 'problem', 'impact'
    ],
    general: [
      'company', 'business', 'services', 'solutions', 'capabilities', 'expertise',
      'experience', 'process', 'approach', 'quality', 'value', 'benefits'
    ]
  };
  
  return keywordMap[sectionType] || keywordMap.general;
}

function findSemanticMatches(sectionTitle: string, sectionType: string, knowledgeEntries: KnowledgeEntry[]): KnowledgeEntry[] {
  const semanticKeywords = getSemanticKeywords(sectionType);
  const allContent = (entry: KnowledgeEntry) => `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
  
  return knowledgeEntries.filter(entry => {
    const content = allContent(entry);
    
    // Check for semantic matches rather than exact keywords
    return semanticKeywords.some(keyword => 
      content.includes(keyword) || 
      // Fuzzy matching for related concepts
      isRelatedConcept(keyword, content)
    );
  });
}

function isRelatedConcept(keyword: string, content: string): boolean {
  const conceptMap: { [key: string]: string[] } = {
    'company': ['organization', 'business', 'firm', 'enterprise', 'corporate'],
    'experience': ['expertise', 'background', 'history', 'track record', 'years'],
    'methodology': ['approach', 'process', 'method', 'technique', 'framework'],
    'team': ['staff', 'personnel', 'employees', 'consultants', 'professionals'],
    'capabilities': ['skills', 'competencies', 'expertise', 'strengths', 'abilities'],
    'services': ['solutions', 'offerings', 'products', 'deliverables', 'consulting'],
    'project': ['assignment', 'engagement', 'initiative', 'work', 'contract'],
    'client': ['customer', 'account', 'partner', 'organization', 'company'],
    'results': ['outcomes', 'achievements', 'success', 'impact', 'benefits'],
    'quality': ['excellence', 'standards', 'best practices', 'assurance', 'control']
  };
  
  const relatedTerms = conceptMap[keyword] || [];
  return relatedTerms.some(term => content.includes(term));
}

function calculateSemanticCoverage(sectionType: string, relevantEntries: KnowledgeEntry[]): number {
  if (relevantEntries.length === 0) return 0;
  
  const keywords = getSemanticKeywords(sectionType);
  const allContent = relevantEntries.map(entry => 
    `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase()
  ).join(' ');
  
  // Count how many semantic keywords are found
  const foundKeywords = keywords.filter(keyword => 
    allContent.includes(keyword) || 
    isRelatedConcept(keyword, allContent)
  );
  
  // Base coverage on keyword coverage but also consider content richness
  const keywordCoverage = (foundKeywords.length / keywords.length) * 100;
  const contentRichness = Math.min(relevantEntries.length * 10, 30); // Bonus for multiple entries
  const contentDepth = Math.min(allContent.length / 500, 20); // Bonus for detailed content
  
  return Math.min(keywordCoverage + contentRichness + contentDepth, 100);
}

function identifyMissingTopics(sectionType: string, relevantEntries: KnowledgeEntry[]): string[] {
  const keywords = getSemanticKeywords(sectionType);
  const allContent = relevantEntries.map(entry => 
    `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase()
  ).join(' ');
  
  return keywords.filter(keyword => 
    !allContent.includes(keyword) && 
    !isRelatedConcept(keyword, allContent)
  ).slice(0, 5); // Limit to top 5 missing topics
}

function generateStrictModeRecommendations(
  sectionType: string, 
  missingTopics: string[], 
  relevantEntriesCount: number,
  totalContentVolume: number,
  expectedTopics: number
): string[] {
  const recommendations = [];
  
  if (missingTopics.length > 0) {
    recommendations.push(`Critical: Add detailed knowledge entries covering: ${missingTopics.slice(0, 3).join(', ')}`);
  }
  
  if (relevantEntriesCount < expectedTopics * 0.6) {
    recommendations.push(`Add at least ${Math.ceil(expectedTopics * 0.6) - relevantEntriesCount} more relevant entries for ${sectionType} sections`);
  }

  if (totalContentVolume < 500) {
    recommendations.push(`Add more detailed content to existing entries. Current: ${totalContentVolume} characters. Required: 500+ characters.`);
  }
  
  // Ultra-specific recommendations for strict mode
  switch (sectionType) {
    case 'executive':
      recommendations.push('Required: Specific value propositions, measurable benefits, client success stories with data');
      break;
    case 'technical':
      recommendations.push('Required: Detailed technical specifications, proven methodologies, implementation processes');
      break;
    case 'team':
      recommendations.push('Required: Complete team profiles with specific qualifications, certifications, and project experience');
      break;
    case 'pricing':
      recommendations.push('Required: Specific pricing models, cost breakdowns, ROI calculations, and value justifications');
      break;
    case 'timeline':
      recommendations.push('Required: Detailed project phases, specific milestones, delivery schedules, and timeline justifications');
      break;
  }

  recommendations.push('Strict mode requires comprehensive, factual content. Generic or placeholder entries will cause generation to fail.');
  
  return recommendations;
}

export function validateGeneratedContent(
  content: string,
  knowledgeEntries: KnowledgeEntry[]
): { isValid: boolean; issues: string[]; confidenceScore: number } {
  const issues: string[] = [];
  let confidenceScore = 100;

  // Ultra-strict validation for anti-hallucination
  const specificClaims = extractSpecificClaims(content);
  
  // Build comprehensive knowledge base text for cross-referencing
  const knowledgeText = knowledgeEntries.map(entry => 
    `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`
  ).join(' ').toLowerCase();

  // Strict claim verification - no synthesis allowed in strict mode
  for (const claim of specificClaims) {
    const claimLower = claim.toLowerCase();
    
    // Check for exact or very close matches in knowledge base
    const isDirectlySupported = knowledgeEntries.some(entry => {
      const entryText = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
      return entryText.includes(claimLower) || 
             // Allow minor variations in wording but require substantial overlap
             claim.split(' ').filter(word => word.length > 3).length > 0 &&
             claim.split(' ').filter(word => word.length > 3).every(word => 
               entryText.includes(word.toLowerCase())
             );
    });
    
    if (!isDirectlySupported) {
      issues.push(`Unsupported specific claim (not found in knowledge base): "${claim}"`);
      confidenceScore -= 20; // Harsh penalties for unsupported claims
    }
  }

  // Ultra-strict check for ANY specific data not in knowledge base
  const strictPatterns = [
    /\$[\d,]+(?:\.\d{2})?/g, // Specific dollar amounts
    /\d+(?:\.\d+)?%/g, // Specific percentages  
    /\d+ (?:years?|months?|weeks?|days?)/g, // Specific time periods
    /founded in \d{4}/gi, // Founding years
    /established in \d{4}/gi,
    /since \d{4}/gi,
    /\d{4}-\d{4}/g, // Date ranges
    /\d+(?:,\d+)* (?:clients?|projects?|employees?|staff)/gi, // Specific numbers
    /over \d+/gi, // "Over X" claims
    /more than \d+/gi, // "More than X" claims
    /up to \d+/gi, // "Up to X" claims
    /\b\d+(?:th|st|nd|rd)? (?:largest|biggest|leading)/gi // Ranking claims
  ];

  for (const pattern of strictPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Ultra-strict validation - must be exactly in knowledge base
        const matchFound = knowledgeText.includes(match.toLowerCase()) || 
                          knowledgeEntries.some(entry => {
                            const entryText = `${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
                            return entryText.includes(match.toLowerCase());
                          });
        
        if (!matchFound) {
          issues.push(`Specific data not verified in knowledge base: "${match}"`);
          confidenceScore -= 25; // Heavy penalty for unverified specific data
        }
      }
    }
  }

  // Check for generic business language that often indicates hallucination
  const genericPhrases = [
    'industry-leading', 'cutting-edge', 'state-of-the-art', 'world-class',
    'proven track record', 'extensive experience', 'comprehensive solution',
    'innovative approach', 'market leader', 'best practices', 'award-winning'
  ];

  const genericCount = genericPhrases.filter(phrase => 
    content.toLowerCase().includes(phrase)
  ).length;

  if (genericCount > 2) {
    issues.push(`Content contains ${genericCount} generic business phrases that may indicate AI hallucination rather than knowledge base content`);
    confidenceScore -= genericCount * 5;
  }

  // Check for company-specific claims without verification
  const companySpecificPatterns = [
    /we (?:are|have been) (?:the|a) leading/gi,
    /our (?:award-winning|industry-leading|proven)/gi,
    /we (?:pioneered|developed|created) the/gi
  ];

  for (const pattern of companySpecificPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!knowledgeText.includes(match.toLowerCase())) {
          issues.push(`Unverified company claim: "${match}"`);
          confidenceScore -= 15;
        }
      }
    }
  }

  // Ultra-strict threshold for anti-hallucination mode
  const isValid = confidenceScore >= 80 && issues.length <= 1; // Much stricter validation
  
  return {
    isValid,
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

// NEW: Section complexity multiplier for dynamic requirements
function getSectionComplexityMultiplier(sectionType: string): number {
  const complexityMap: { [key: string]: number } = {
    'team': 2.5,        // Team sections need detailed member info
    'pricing': 2.0,     // Pricing needs specific rates/models  
    'technical': 1.8,   // Technical needs specific processes
    'company': 1.5,     // Company needs comprehensive info
    'executive': 1.3,   // Executive needs high-level overview
    'timeline': 1.2,    // Timeline needs project phases
    'case_study': 1.8,  // Case studies need specific examples
    'general': 1.0      // General sections baseline
  };
  
  return complexityMap[sectionType] || 1.0;
}

// NEW: Section-specific content validation
function checkSectionSpecificContent(sectionType: string, content: string): { isRelevant: boolean; issues: string[] } {
  const issues: string[] = [];
  
  switch (sectionType) {
    case 'team':
      if (!content.match(/(name|experience|role|qualification|certificate|degree|years|background)/gi)) {
        issues.push('Team section requires specific personnel information');
      }
      break;
    case 'pricing':
      if (!content.match(/(\$|price|cost|rate|fee|budget|investment|hourly|fixed)/gi)) {
        issues.push('Pricing section requires specific cost information');
      }
      break;
    case 'technical':
      if (!content.match(/(process|method|technology|system|framework|implementation|procedure)/gi)) {
        issues.push('Technical section requires specific methodology information');
      }
      break;
    case 'company':
      if (!content.match(/(founded|established|office|headquarters|client|customer|service|business)/gi)) {
        issues.push('Company section requires specific organizational information');
      }
      break;
  }
  
  return {
    isRelevant: issues.length === 0,
    issues
  };
}

// NEW: Section-specific requirements validation
function getSectionSpecificRequirements(sectionType: string, entries: KnowledgeEntry[]): { areMet: boolean; missing: string[] } {
  const missing: string[] = [];
  const allContent = entries.map(e => `${e.title} ${e.content || ''} ${e.parsed_content || ''}`).join(' ').toLowerCase();
  
  switch (sectionType) {
    case 'team':
      if (!allContent.includes('experience') && !allContent.includes('qualification')) {
        missing.push('Team member experience/qualifications');
      }
      if (!allContent.match(/\d+\s*year/gi)) {
        missing.push('Specific years of experience');
      }
      break;
      
    case 'pricing':
      if (!allContent.match(/\$[\d,]+/g) && !allContent.match(/\d+\s*per\s*(hour|day|month)/gi)) {
        missing.push('Specific pricing information with amounts');
      }
      break;
      
    case 'technical':
      if (entries.length < 2) {
        missing.push('At least 2 entries describing technical processes');
      }
      break;
      
    case 'company':
      if (!allContent.includes('founded') && !allContent.includes('established') && !allContent.includes('since')) {
        missing.push('Company history/founding information');
      }
      break;
  }
  
  return {
    areMet: missing.length === 0,
    missing
  };
}