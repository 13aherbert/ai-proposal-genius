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
  const content = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
  let score = 0;
  
  // Keyword matching with weighted scoring
  keywords.forEach(keyword => {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(keywordRegex);
    if (matches) {
      score += matches.length * 0.1; // Each match adds 0.1 to score
    }
  });
  
  // Category relevance boost
  if (entry.category.toLowerCase().includes(sectionType)) {
    score += 0.3;
  }
  
  // Content quality boost for substantial entries
  const contentLength = (entry.content?.length || 0) + (entry.parsed_content?.length || 0);
  if (contentLength > 500) {
    score += 0.2;
  }
  
  // Penalize very short or placeholder content
  if (contentLength < 100) {
    score *= 0.1;
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
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