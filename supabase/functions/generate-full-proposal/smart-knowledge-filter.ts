// Smart knowledge base filtering for token optimization
// Selects only relevant knowledge entries per section to reduce input tokens

export interface KnowledgeEntry {
  entry_id: string;
  title: string;
  content: string | null;
  category: string;
  parsed_content: string | null;
}

export interface FilteredKnowledge {
  entries: KnowledgeEntry[];
  formattedContext: string;
  originalLength: number;
  filteredLength: number;
  reductionPercent: number;
}

// Section-specific keywords for relevance scoring
const SECTION_KEYWORDS: { [key: string]: string[] } = {
  executive: ['company', 'business', 'overview', 'value', 'benefits', 'experience', 'capabilities', 'mission', 'vision', 'success', 'results'],
  company: ['company', 'business', 'organization', 'about', 'history', 'mission', 'values', 'profile', 'founded', 'culture'],
  technical: ['technical', 'methodology', 'approach', 'process', 'technology', 'solution', 'system', 'implementation', 'architecture', 'design', 'tools'],
  team: ['team', 'personnel', 'staff', 'experience', 'qualifications', 'expertise', 'professionals', 'certifications', 'roles', 'leadership'],
  pricing: ['cost', 'price', 'budget', 'fee', 'rate', 'investment', 'value', 'roi', 'savings', 'pricing model'],
  timeline: ['timeline', 'schedule', 'delivery', 'milestone', 'phase', 'implementation', 'weeks', 'months', 'project plan'],
  general: ['company', 'experience', 'service', 'project', 'capability', 'solution', 'quality', 'client']
};

// Max entries to include per section type (reduces context size)
const MAX_ENTRIES_PER_SECTION: { [key: string]: number } = {
  executive: 4,
  company: 3,
  technical: 5,
  team: 3,
  pricing: 2,
  timeline: 2,
  general: 4
};

// Category to section type mapping for relevance boost
const CATEGORY_RELEVANCE: { [sectionType: string]: { [category: string]: number } } = {
  executive: { company: 0.8, overview: 0.8, business: 0.7, services: 0.6, capabilities: 0.7 },
  technical: { technical: 0.9, methodology: 0.8, approach: 0.8, process: 0.7, solution: 0.8 },
  team: { team: 0.9, staff: 0.8, personnel: 0.8, experience: 0.7, qualifications: 0.8 },
  company: { company: 0.9, about: 0.8, history: 0.7, profile: 0.8, overview: 0.7 },
  pricing: { pricing: 0.9, cost: 0.8, budget: 0.7, financial: 0.7, rates: 0.8 },
  timeline: { timeline: 0.9, schedule: 0.8, project: 0.6, delivery: 0.7 }
};

/**
 * Calculate relevance score for an entry given a section type and title
 */
function calculateRelevanceScore(
  entry: KnowledgeEntry,
  sectionType: string,
  sectionTitle: string
): number {
  const titleLower = entry.title.toLowerCase();
  const content = `${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
  const categoryLower = entry.category.toLowerCase();
  const fullText = `${titleLower} ${content}`;
  
  let score = 0;
  
  // Get keywords for this section type
  const keywords = SECTION_KEYWORDS[sectionType] || SECTION_KEYWORDS.general;
  
  // Extract keywords from section title
  const titleKeywords = sectionTitle
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(word => word.length > 2 && !['and', 'the', 'for', 'with', 'our', 'your'].includes(word));
  
  const allKeywords = [...keywords, ...titleKeywords];
  
  // Score keyword matches
  for (const keyword of allKeywords) {
    // Exact word boundary matches get higher weight
    const exactMatches = fullText.match(new RegExp(`\\b${keyword}\\b`, 'g'));
    if (exactMatches) {
      score += exactMatches.length * 0.2;
    }
    
    // Title matches get extra weight
    if (titleLower.includes(keyword)) {
      score += 0.3;
    }
  }
  
  // Category relevance boost
  const categoryRelevance = CATEGORY_RELEVANCE[sectionType] || {};
  for (const [catKey, relevance] of Object.entries(categoryRelevance)) {
    if (categoryLower.includes(catKey)) {
      score += relevance;
      break; // Only apply one category boost
    }
  }
  
  // Content quality bonuses
  const contentLength = content.length;
  if (contentLength > 2000) {
    score += 0.3; // Comprehensive content
  } else if (contentLength > 500) {
    score += 0.2;
  } else if (contentLength > 100) {
    score += 0.1;
  } else if (contentLength < 50) {
    score *= 0.3; // Penalize very thin content
  }
  
  // Bonus for structured content (lists, headers)
  if (content.match(/^\s*[-•*]\s/m) || content.match(/^\s*\d+\.\s/m)) {
    score += 0.15;
  }
  
  // Bonus for data-rich content (numbers, dates, specifics)
  const dataMatches = content.match(/\b\d{4}\b|\d+%|\$[\d,]+|\b\d+\s+(?:years?|projects?|clients?)/g);
  if (dataMatches && dataMatches.length > 2) {
    score += 0.2;
  }
  
  return Math.min(score, 2.5); // Cap for discrimination
}

/**
 * Summarize long content to key points
 */
function summarizeContent(content: string, sectionType: string, maxLength: number = 1500): string {
  if (!content || content.length <= maxLength) {
    return content;
  }
  
  // Extract sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) {
    return content.substring(0, maxLength);
  }
  
  // Get section keywords for relevance
  const keywords = SECTION_KEYWORDS[sectionType] || SECTION_KEYWORDS.general;
  
  // Score sentences by keyword relevance
  const scoredSentences = sentences.map(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (sentenceLower.includes(keyword)) {
        score += 1;
      }
    }
    
    // Boost first few sentences (often most important)
    if (sentences.indexOf(sentence) < 3) {
      score += 0.5;
    }
    
    return { sentence: sentence.trim(), score };
  });
  
  // Sort by score and take top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.sentence);
  
  const summarized = topSentences.join('. ') + '.';
  
  return summarized.length > maxLength 
    ? summarized.substring(0, maxLength) + '...'
    : summarized;
}

/**
 * Filter and optimize knowledge base for a specific section
 */
export function filterKnowledgeForSection(
  entries: KnowledgeEntry[],
  sectionTitle: string,
  sectionType: string
): FilteredKnowledge {
  // Calculate original total length
  const originalLength = entries.reduce((total, entry) => {
    return total + (entry.content?.length || 0) + (entry.parsed_content?.length || 0);
  }, 0);
  
  // Score and rank entries
  const scoredEntries = entries
    .map(entry => ({
      entry,
      score: calculateRelevanceScore(entry, sectionType, sectionTitle)
    }))
    .filter(item => item.score > 0.15) // Minimum relevance threshold
    .sort((a, b) => b.score - a.score);
  
  // Take top N entries for this section type
  const maxEntries = MAX_ENTRIES_PER_SECTION[sectionType] || 4;
  const topEntries = scoredEntries.slice(0, maxEntries).map(item => item.entry);
  
  // Format the filtered context with summarized content
  let formattedContext = '';
  
  if (topEntries.length > 0) {
    formattedContext = `RELEVANT KNOWLEDGE (${sectionType.toUpperCase()} - ${sectionTitle}):\n\n`;
    
    for (const entry of topEntries) {
      const fullContent = `${entry.content || ''} ${entry.parsed_content || ''}`.trim();
      const summarized = summarizeContent(fullContent, sectionType);
      
      formattedContext += `[${entry.title}] (${entry.category})\n`;
      formattedContext += `${summarized}\n\n`;
    }
  } else {
    formattedContext = `[No highly relevant knowledge entries found for "${sectionTitle}". Use general company information and RFP requirements.]\n`;
  }
  
  const filteredLength = formattedContext.length;
  const reductionPercent = originalLength > 0 
    ? Math.round((1 - filteredLength / originalLength) * 100)
    : 0;
  
  console.log(`Knowledge filter: ${entries.length} → ${topEntries.length} entries, ${originalLength} → ${filteredLength} chars (${reductionPercent}% reduction)`);
  
  return {
    entries: topEntries,
    formattedContext,
    originalLength,
    filteredLength,
    reductionPercent
  };
}

/**
 * Create a condensed company profile from knowledge entries
 */
export function createCompanyProfile(entries: KnowledgeEntry[]): string {
  const companyEntries = entries.filter(entry => {
    const titleLower = entry.title.toLowerCase();
    const categoryLower = entry.category.toLowerCase();
    
    return categoryLower.includes('company') ||
           categoryLower.includes('about') ||
           categoryLower.includes('overview') ||
           titleLower.includes('company') ||
           titleLower.includes('about us');
  });
  
  if (companyEntries.length === 0) {
    return '';
  }
  
  let profile = 'COMPANY PROFILE:\n';
  
  // Take up to 2 company entries
  for (const entry of companyEntries.slice(0, 2)) {
    const content = `${entry.content || ''} ${entry.parsed_content || ''}`.trim();
    const summarized = summarizeContent(content, 'company', 800);
    profile += `${summarized}\n`;
  }
  
  return profile;
}
