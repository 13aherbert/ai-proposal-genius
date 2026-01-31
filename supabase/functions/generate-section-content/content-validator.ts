// Content Validator - Post-generation quality enforcement
export interface ValidationIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: string;
  message: string;
  location?: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
  metrics: {
    wordCount: number;
    avgSentenceLength: number;
    bannedPhrasesFound: string[];
    vaguePatternsFound: string[];
    unattributedStats: string[];
  };
}

// Hyperbolic and marketing language that undermines credibility
const BANNED_WORDS = [
  'catastrophic', 'bulletproof', 'ruthless', 'weaponize', 'mesmerizing',
  'unparalleled', 'world-class', 'cutting-edge', 'state-of-the-art',
  'synergy', 'paradigm', 'leverage', 'unprecedented', 'revolutionary',
  'game-changing', 'best-in-class', 'industry-leading', 'groundbreaking'
];

// Weak language that reduces confidence
const WEAK_PHRASES = [
  'we believe', 'we think', 'we feel', 'we hope',
  'would be able to', 'might be able to', 'could potentially',
  'perhaps', 'possibly', 'arguably', 'it is believed that'
];

// Vague language patterns
const VAGUE_PATTERNS = [
  /various\s+\w+/gi,
  /multiple\s+\w+/gi,
  /numerous\s+\w+/gi,
  /several\s+\w+/gi,
  /extensive\s+experience/gi,
  /significant\s+(improvement|increase|decrease|growth)/gi,
  /substantial\s+\w+/gi
];

// Pattern for unattributed statistics
const UNATTRIBUTED_STAT_PATTERN = /\b(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+x\s+(?:faster|better|more)|(?:over|more than|approximately)\s+\d+\s+(?:years?|months?|days?|projects?|clients?))\b/gi;

// Section-specific word limits
const SECTION_WORD_LIMITS: { [key: string]: number } = {
  'executive': 400,
  'technical': 600,
  'team': 400,
  'timeline': 350,
  'pricing': 500,
  'general': 500
};

export function validateGeneratedContent(
  content: string,
  sectionType: string,
  knowledgeContent: string
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestions: string[] = [];
  
  // Calculate metrics
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgSentenceLength = sentences.length > 0 
    ? words.length / sentences.length 
    : 0;
  
  // Check for banned phrases
  const bannedPhrasesFound: string[] = [];
  const contentLower = content.toLowerCase();
  
  BANNED_WORDS.forEach(word => {
    if (contentLower.includes(word.toLowerCase())) {
      bannedPhrasesFound.push(word);
    }
  });
  
  WEAK_PHRASES.forEach(phrase => {
    if (contentLower.includes(phrase.toLowerCase())) {
      bannedPhrasesFound.push(phrase);
    }
  });
  
  // Check for vague patterns
  const vaguePatternsFound: string[] = [];
  VAGUE_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      vaguePatternsFound.push(...matches);
    }
  });
  
  // Check for unattributed statistics
  const unattributedStats: string[] = [];
  const statMatches = content.match(UNATTRIBUTED_STAT_PATTERN) || [];
  
  statMatches.forEach(stat => {
    // Check if this stat appears in the knowledge base
    const statNormalized = stat.replace(/,/g, '').toLowerCase();
    const knowledgeLower = knowledgeContent.toLowerCase();
    
    // Very rough check - if the stat doesn't appear in knowledge, flag it
    if (!knowledgeLower.includes(statNormalized)) {
      unattributedStats.push(stat);
    }
  });
  
  // Generate issues based on findings
  
  // Word count check
  const maxWords = SECTION_WORD_LIMITS[sectionType] || SECTION_WORD_LIMITS.general;
  if (wordCount > maxWords) {
    issues.push({
      type: 'warning',
      category: 'verbosity',
      message: `Content exceeds ${maxWords} word limit for ${sectionType} sections (${wordCount} words). Consider condensing.`
    });
    suggestions.push(`Reduce content by approximately ${wordCount - maxWords} words`);
  }
  
  // Sentence length check
  if (avgSentenceLength > 25) {
    issues.push({
      type: 'warning',
      category: 'readability',
      message: `Average sentence length (${avgSentenceLength.toFixed(1)} words) exceeds recommended 20-25 words.`
    });
    suggestions.push('Break long sentences into shorter, clearer statements');
  }
  
  // Banned phrases check
  if (bannedPhrasesFound.length > 0) {
    issues.push({
      type: 'critical',
      category: 'credibility',
      message: `Found ${bannedPhrasesFound.length} banned/weak phrases that undermine credibility: ${bannedPhrasesFound.slice(0, 5).join(', ')}${bannedPhrasesFound.length > 5 ? '...' : ''}`
    });
    suggestions.push('Replace hyperbolic language with specific, factual claims');
  }
  
  // Vague patterns check
  if (vaguePatternsFound.length > 0) {
    issues.push({
      type: 'warning',
      category: 'specificity',
      message: `Found ${vaguePatternsFound.length} vague phrases: ${vaguePatternsFound.slice(0, 3).join(', ')}${vaguePatternsFound.length > 3 ? '...' : ''}`
    });
    suggestions.push('Replace vague quantifiers with specific numbers');
  }
  
  // Unattributed statistics check
  if (unattributedStats.length > 0) {
    issues.push({
      type: 'critical',
      category: 'hallucination',
      message: `Found ${unattributedStats.length} statistics that may not be from knowledge base: ${unattributedStats.slice(0, 3).join(', ')}${unattributedStats.length > 3 ? '...' : ''}`
    });
    suggestions.push('Verify all statistics have knowledge base sources or remove them');
  }
  
  // Check for very long sentences (over 40 words)
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 40);
  if (longSentences.length > 0) {
    issues.push({
      type: 'warning',
      category: 'readability',
      message: `Found ${longSentences.length} sentences over 40 words`
    });
  }
  
  // Determine if validation passed
  const criticalIssues = issues.filter(i => i.type === 'critical');
  const passed = criticalIssues.length === 0;
  
  return {
    passed,
    issues,
    suggestions,
    metrics: {
      wordCount,
      avgSentenceLength,
      bannedPhrasesFound,
      vaguePatternsFound,
      unattributedStats
    }
  };
}

// Quick check for the most critical issues only
export function quickValidate(content: string): { passed: boolean; criticalIssues: string[] } {
  const criticalIssues: string[] = [];
  const contentLower = content.toLowerCase();
  
  // Check for most egregious banned words
  const criticalBanned = ['catastrophic', 'bulletproof', 'ruthless', 'weaponize', 'unparalleled'];
  criticalBanned.forEach(word => {
    if (contentLower.includes(word)) {
      criticalIssues.push(`Contains banned word: "${word}"`);
    }
  });
  
  // Check for placeholder text
  if (content.includes('{{') || content.includes('[INSERT') || content.includes('[TODO')) {
    criticalIssues.push('Contains placeholder text');
  }
  
  // Check minimum length
  if (content.trim().length < 100) {
    criticalIssues.push('Content too short (minimum 100 characters)');
  }
  
  return {
    passed: criticalIssues.length === 0,
    criticalIssues
  };
}

// Get word limit for a section type
export function getWordLimit(sectionType: string): number {
  return SECTION_WORD_LIMITS[sectionType] || SECTION_WORD_LIMITS.general;
}
