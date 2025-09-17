import { KnowledgeEntry } from "./types.ts";

export interface FilteredKnowledgeContext {
  relevantEntries: KnowledgeEntry[];
  sectionSpecificContent: string;
  companyProfile: string;
  totalContentLength: number;
}

// Intelligent content filtering and summarization for token optimization
export function filterAndOptimizeKnowledgeBase(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): FilteredKnowledgeContext {
  
  // Phase 1: Smart section-specific filtering
  const relevantEntries = selectRelevantEntries(entries, sectionType, sectionTitle);
  
  // Phase 2: Content summarization and chunking
  const sectionSpecificContent = extractSectionSpecificContent(relevantEntries, sectionType);
  const companyProfile = createCompanyProfile(entries); // Cached across sections
  
  const totalContentLength = sectionSpecificContent.length + companyProfile.length;
  
  console.log(`Token optimization: ${entries.length} → ${relevantEntries.length} entries, ${totalContentLength} chars`);
  
  return {
    relevantEntries,
    sectionSpecificContent,
    companyProfile,
    totalContentLength
  };
}

function selectRelevantEntries(
  entries: KnowledgeEntry[], 
  sectionType: string, 
  sectionTitle: string
): KnowledgeEntry[] {
  
  // Get section-specific keywords for relevance scoring
  const keywords = getSectionKeywords(sectionType);
  const titleKeywords = extractKeywordsFromTitle(sectionTitle);
  const allKeywords = [...keywords, ...titleKeywords];
  
  // Score and rank entries by relevance
  const scoredEntries = entries
    .map(entry => ({
      entry,
      score: calculateRelevanceScore(entry, allKeywords, sectionType)
    }))
    .filter(item => item.score > 0.1) // Minimum relevance threshold
    .sort((a, b) => b.score - a.score);
  
  // Select top entries based on section complexity
  const maxEntries = getMaxEntriesForSection(sectionType);
  return scoredEntries.slice(0, maxEntries).map(item => item.entry);
}

export function getSectionKeywords(sectionType: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    executive: ['company', 'business', 'overview', 'value', 'benefits', 'experience', 'capabilities'],
    company: ['company', 'business', 'organization', 'about', 'history', 'mission', 'values', 'profile'],
    technical: ['technical', 'methodology', 'approach', 'process', 'technology', 'solution', 'system'],
    team: ['team', 'personnel', 'staff', 'experience', 'qualifications', 'expertise', 'professionals'],
    pricing: ['cost', 'price', 'budget', 'fee', 'rate', 'investment', 'value', 'roi'],
    timeline: ['timeline', 'schedule', 'delivery', 'milestone', 'phase', 'implementation'],
    general: ['company', 'experience', 'service', 'project', 'capability']
  };
  
  return keywordMap[sectionType] || keywordMap.general;
}

function extractKeywordsFromTitle(title: string): string[] {
  // Extract meaningful words from section title
  return title
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(word => word.length > 2 && !['and', 'the', 'for', 'with', 'our'].includes(word));
}

function calculateRelevanceScore(
  entry: KnowledgeEntry, 
  keywords: string[], 
  sectionType: string
): number {
  const title = entry.title.toLowerCase();
  const content = `${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
  const fullText = `${title} ${content}`;
  let score = 0;
  
  // Enhanced semantic keyword matching
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    // Exact keyword matches (highest weight)
    const exactMatches = fullText.match(new RegExp(`\\b${keywordLower}\\b`, 'g'));
    if (exactMatches) {
      score += exactMatches.length * 0.2;
    }
    
    // Partial matches and related terms
    const partialMatches = fullText.match(new RegExp(keywordLower, 'g'));
    if (partialMatches) {
      score += partialMatches.length * 0.1;
    }
    
    // Title matches get extra weight
    if (title.includes(keywordLower)) {
      score += 0.3;
    }
    
    // Semantic similarity for related terms
    const synonymMap: { [key: string]: string[] } = {
      'technical': ['technology', 'system', 'solution', 'approach', 'methodology'],
      'team': ['staff', 'personnel', 'experts', 'professionals', 'workforce'],
      'experience': ['expertise', 'background', 'history', 'track record', 'portfolio'],
      'company': ['organization', 'business', 'firm', 'corporation'],
      'project': ['initiative', 'engagement', 'work', 'contract', 'assignment']
    };
    
    const synonyms = synonymMap[keywordLower] || [];
    synonyms.forEach(synonym => {
      if (fullText.includes(synonym)) {
        score += 0.15; // Synonym matches
      }
    });
  });
  
  // Section-specific category matching
  const categoryMatch = getCategoryRelevance(entry.category, sectionType);
  score += categoryMatch;
  
  // Content quality and freshness scoring
  const contentLength = content.length;
  if (contentLength > 2000) {
    score += 0.3; // Comprehensive content
  } else if (contentLength > 500) {
    score += 0.2; // Good content
  } else if (contentLength > 100) {
    score += 0.1; // Basic content
  } else if (contentLength < 50) {
    score *= 0.2; // Penalize very thin content
  }
  
  // Boost for structured content (lists, headers, etc.)
  if (content.match(/^\s*[-•*]\s/m) || content.match(/^\s*\d+\.\s/m)) {
    score += 0.15; // Structured content bonus
  }
  
  // Boost for data-rich content (numbers, dates, specifics)
  const dataMatches = content.match(/\b\d{4}\b|\d+%|\$[\d,]+|\b\d+\s+(?:years?|projects?|clients?)/g);
  if (dataMatches && dataMatches.length > 2) {
    score += 0.2; // Rich data content
  }
  
  return Math.min(score, 2.0); // Increased cap for better discrimination
}

function getCategoryRelevance(category: string, sectionType: string): number {
  const categoryLower = category.toLowerCase();
  
  const relevanceMap: { [key: string]: { [key: string]: number } } = {
    'executive': {
      'company': 0.8, 'overview': 0.8, 'business': 0.7, 'services': 0.6, 'capabilities': 0.7
    },
    'technical': {
      'technical': 0.9, 'methodology': 0.8, 'approach': 0.8, 'process': 0.7, 'system': 0.7, 'solution': 0.8
    },
    'team': {
      'team': 0.9, 'staff': 0.8, 'personnel': 0.8, 'experience': 0.7, 'qualifications': 0.8, 'expertise': 0.7
    },
    'company': {
      'company': 0.9, 'about': 0.8, 'history': 0.7, 'profile': 0.8, 'overview': 0.7, 'business': 0.8
    },
    'pricing': {
      'pricing': 0.9, 'cost': 0.8, 'budget': 0.7, 'financial': 0.7, 'rates': 0.8
    }
  };
  
  const sectionRelevance = relevanceMap[sectionType] || {};
  
  for (const [catKey, relevance] of Object.entries(sectionRelevance)) {
    if (categoryLower.includes(catKey)) {
      return relevance;
    }
  }
  
  return 0.1; // Default low relevance for unmatched categories
}

function getMaxEntriesForSection(sectionType: string): number {
  const entryLimits: { [key: string]: number } = {
    executive: 4,     // High-level overview needs diverse content
    company: 3,       // Company info is focused
    technical: 5,     // Technical sections need detailed content
    team: 3,          // Team info is specific
    pricing: 2,       // Pricing is usually focused
    timeline: 2,      // Timeline info is specific
    general: 4        // General sections need variety
  };
  
  return entryLimits[sectionType] || 3;
}

function extractSectionSpecificContent(
  entries: KnowledgeEntry[], 
  sectionType: string
): string {
  if (!entries.length) return "No relevant content available.";
  
  // Create condensed, section-focused content
  let content = `SECTION-SPECIFIC CONTENT (${sectionType.toUpperCase()}):\n\n`;
  
  entries.forEach((entry, index) => {
    // Summarize each entry instead of including full content
    const summary = summarizeEntry(entry, sectionType);
    content += `${index + 1}. ${entry.title}\n${summary}\n\n`;
  });
  
  return content;
}

function summarizeEntry(entry: KnowledgeEntry, sectionType: string): string {
  const fullContent = `${entry.content || ''} ${entry.parsed_content || ''}`.trim();
  
  if (!fullContent) return "No content available.";
  
  // For very long content (RFP responses), extract key points only
  if (fullContent.length > 2000) {
    return extractKeyPoints(fullContent, sectionType);
  }
  
  // For medium content, use first few sentences
  if (fullContent.length > 500) {
    const sentences = fullContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ') + '.';
  }
  
  // For short content, use as-is
  return fullContent;
}

function extractKeyPoints(content: string, sectionType: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keywords = getSectionKeywords(sectionType);
  
  // Find sentences most relevant to section type
  const relevantSentences = sentences
    .map(sentence => ({
      sentence: sentence.trim(),
      score: keywords.reduce((score, keyword) => {
        return score + (sentence.toLowerCase().includes(keyword) ? 1 : 0);
      }, 0)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.sentence);
  
  return relevantSentences.length > 0 
    ? relevantSentences.join('. ') + '.'
    : sentences.slice(0, 2).join('. ') + '.';
}

function createCompanyProfile(entries: KnowledgeEntry[]): string {
  // Create a condensed company profile from all entries
  const companyEntries = entries.filter(entry => 
    entry.category.toLowerCase().includes('company') ||
    entry.title.toLowerCase().includes('company') ||
    entry.title.toLowerCase().includes('about')
  );
  
  if (!companyEntries.length) {
    return "COMPANY PROFILE: No specific company information available.";
  }
  
  let profile = "COMPANY PROFILE:\n";
  companyEntries.slice(0, 2).forEach(entry => {
    const summary = summarizeEntry(entry, 'company');
    profile += `${summary}\n`;
  });
  
  return profile;
}

// Format optimized context for prompt (replaces enhanced-knowledge-base.ts)
export function formatOptimizedKnowledgeContext(context: FilteredKnowledgeContext): string {
  return `KNOWLEDGE BASE CONTEXT (${context.totalContentLength} chars):

${context.companyProfile}

${context.sectionSpecificContent}

ENTRIES USED: ${context.relevantEntries.length} most relevant entries selected for efficiency.`;
}