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
  
  // Use semantic matching to find relevant entries
  const relevantEntries = findSemanticMatches(sectionTitle, sectionType, knowledgeEntries);
  
  // Calculate coverage based on semantic relevance rather than strict keyword matching
  const coverageScore = calculateSemanticCoverage(sectionType, relevantEntries);
  
  // More lenient thresholds based on section type and available content
  const adequacyThresholds = {
    'executive': 40,    // Executive summaries can be created from general company info
    'company': 45,      // Company sections need basic company info
    'general': 35,      // General sections are flexible
    'technical': 55,    // Technical sections need more specific info
    'team': 50,         // Team sections need some specific info
    'timeline': 40,     // Timelines can be estimated from process info
    'pricing': 60,      // Pricing needs more specific information
    'case_study': 50    // Case studies need examples
  };
  
  const threshold = adequacyThresholds[sectionType as keyof typeof adequacyThresholds] || 40;
  const isAdequate = coverageScore >= threshold && relevantEntries.length > 0;
  
  const missingTopics = identifyMissingTopics(sectionType, relevantEntries);
  
  return {
    isAdequate,
    missingTopics,
    coverageScore,
    relevantEntries,
    recommendations: generateSmartRecommendations(missingTopics, sectionType, relevantEntries)
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

function generateSmartRecommendations(missingTopics: string[], sectionType: string, relevantEntries: KnowledgeEntry[]): string[] {
  if (missingTopics.length === 0 && relevantEntries.length > 0) {
    return ["Knowledge base coverage is adequate. AI can synthesize available information for this section."];
  }
  
  const recommendations = [];
  
  if (relevantEntries.length === 0) {
    recommendations.push(`No relevant knowledge base entries found. Add entries with information about your ${sectionType === 'executive' ? 'company overview and capabilities' : `${sectionType} approach and experience`}.`);
  } else if (missingTopics.length > 0) {
    const priorityTopics = missingTopics.slice(0, 3);
    recommendations.push(`To enhance content quality, consider adding: ${priorityTopics.join(', ')}`);
  }
  
  // Section-specific recommendations based on what's typically needed
  const specificRecs: { [key: string]: string } = {
    'executive': 'Include company history, mission, key differentiators, and success stories.',
    'technical': 'Document your methodologies, tools, technologies, and implementation approaches.',
    'team': 'Add team member profiles, qualifications, certifications, and relevant experience.',
    'timeline': 'Include typical project phases, standard timelines, and milestone examples.',
    'pricing': 'Add your pricing models, rate structures, and cost breakdown approaches.',
    'company': 'Include company background, services offered, client testimonials, and achievements.',
    'case_study': 'Upload specific project examples with outcomes, metrics, and client feedback.'
  };
  
  const specific = specificRecs[sectionType];
  if (specific && relevantEntries.length < 2) {
    recommendations.push(specific);
  }
  
  return recommendations.length > 0 ? recommendations : ["Knowledge base appears adequate for content generation using available information."];
}

export function validateGeneratedContent(
  content: string,
  knowledgeEntries: KnowledgeEntry[]
): { isValid: boolean; issues: string[]; confidenceScore: number } {
  const issues: string[] = [];
  let confidenceScore = 100;
  
  // More permissive validation - focus on preventing obvious hallucinations
  const obviousHallucinationPatterns = [
    // Only flag very specific/unusual percentages that seem made up
    /\b\d{3,}(\.\d+)?%/g, // Percentages over 100% (likely fabricated)
    // Only flag very specific monetary amounts that seem fabricated
    /\$\d{1,3}(?:,\d{3}){2,}/g, // Very large specific amounts (millions+) 
    // Flag specific years without context that could be fabricated
    /\b(established|founded|since) \d{4}(?!\s*(based on|according to|as noted))/gi,
    // Only flag obviously fabricated specific numbers
    /\b(over|more than|exactly) \d{4,}\b(?!\s*(projects|clients|years|hours))/gi
  ];
  
  for (const pattern of obviousHallucinationPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Potentially fabricated specific claims: ${matches.join(', ')}`);
      confidenceScore -= 20; // Reduce confidence but don't fail completely
    }
  }
  
  // Check for completely unsupported company-specific claims
  const companySpecificPatterns = [
    /\b(we are|our company is) (the largest|number one|top-ranked)/gi,
    /\b(award winner|industry leader|market leader) in \d{4}/gi,
    /\bfounded by [A-Z][a-z]+ [A-Z][a-z]+/g // Specific founder names not in KB
  ];
  
  for (const pattern of companySpecificPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      const allKnowledgeText = knowledgeEntries
        .map(entry => `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`)
        .join(' ')
        .toLowerCase();
        
      // Only flag if completely absent from knowledge base
      const unsupportedMatches = matches.filter(match => 
        !allKnowledgeText.includes(match.toLowerCase().replace(/[^\w\s]/g, ''))
      );
      
      if (unsupportedMatches.length > 0) {
        issues.push(`Company-specific claims not found in knowledge base: ${unsupportedMatches.join(', ')}`);
        confidenceScore -= 15;
      }
    }
  }
  
  // Much more lenient approach - allow reasonable synthesis and inference
  // Only count as invalid if confidence is very low (major red flags)
  const isValid = confidenceScore >= 40; // Much more permissive threshold
  
  return {
    isValid,
    issues: issues.length > 0 ? issues : [], // Still log issues for debugging
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