// Tiered model selection for AI cost optimization
// Selects optimal model based on section complexity and content requirements

export interface ModelConfig {
  model: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
  displayName: string;
}

export interface CostMetrics {
  modelUsed: string;
  costTier: string;
  estimatedCostReduction: number; // Percentage vs Opus baseline
}

// Model tiers with their configurations
const MODELS = {
  HIGH: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 2500,
    costTier: 'high' as const,
    displayName: 'Claude Sonnet 4.5 (High Quality)'
  },
  MEDIUM: {
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 1500,
    costTier: 'medium' as const,
    displayName: 'Claude Sonnet 4.5 (Balanced)'
  },
  LOW: {
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1200,
    costTier: 'low' as const,
    displayName: 'Claude Haiku 4.5 (Fast & Efficient)'
  }
};

// Relative cost of each model vs Opus (1.0 baseline)
const MODEL_COSTS: { [key: string]: number } = {
  'claude-opus-4-5-20250929': 1.0,
  'claude-sonnet-4-5-20250929': 0.60,
  'claude-haiku-4-5-20251001': 0.20
};

// Section type keywords for classification
const SECTION_TYPE_PATTERNS = {
  executive: ['executive', 'summary', 'overview', 'introduction', 'abstract'],
  technical: ['technical', 'approach', 'methodology', 'solution', 'implementation', 'architecture', 'design', 'system'],
  team: ['team', 'personnel', 'staff', 'qualifications', 'expertise', 'resources', 'organization chart'],
  pricing: ['cost', 'price', 'budget', 'investment', 'financial', 'fee', 'rate', 'pricing'],
  timeline: ['timeline', 'schedule', 'milestone', 'delivery', 'phase', 'gantt', 'project plan'],
  company: ['company', 'about', 'organization', 'background', 'history', 'profile', 'who we are']
};

// Complexity indicators that suggest more capable model
const COMPLEXITY_INDICATORS = [
  'strategy', 'approach', 'methodology', 'analysis', 'evaluation',
  'implementation', 'comprehensive', 'detailed', 'advanced', 'complex',
  'integration', 'architecture', 'framework', 'optimization'
];

/**
 * Detect section type from title
 */
export function detectSectionType(sectionTitle: string): string {
  const titleLower = sectionTitle.toLowerCase();
  
  for (const [type, patterns] of Object.entries(SECTION_TYPE_PATTERNS)) {
    if (patterns.some(pattern => titleLower.includes(pattern))) {
      return type;
    }
  }
  
  return 'general';
}

/**
 * Calculate complexity score for a section (0.0 - 1.0)
 */
function calculateComplexity(sectionTitle: string, sectionType: string): number {
  // Base complexity by section type
  const baseComplexity: { [key: string]: number } = {
    executive: 0.9,    // Requires strategic thinking and synthesis
    technical: 0.8,    // Needs technical accuracy and detail
    pricing: 0.6,      // Requires careful calculation and justification
    timeline: 0.5,     // Structured but straightforward
    team: 0.4,         // Factual with some narrative
    company: 0.3,      // Straightforward factual content
    general: 0.5       // Default medium complexity
  };
  
  let complexity = baseComplexity[sectionType] || 0.5;
  
  // Adjust based on title length (longer titles often mean more complex sections)
  const titleWords = sectionTitle.split(/\s+/).length;
  if (titleWords > 6) {
    complexity += 0.1;
  }
  
  // Check for complexity indicators in title
  const titleLower = sectionTitle.toLowerCase();
  const hasComplexityIndicators = COMPLEXITY_INDICATORS.some(indicator => 
    titleLower.includes(indicator)
  );
  
  if (hasComplexityIndicators) {
    complexity += 0.15;
  }
  
  return Math.min(complexity, 1.0);
}

/**
 * Select optimal model configuration based on section requirements
 */
export function selectOptimalModel(sectionTitle: string, contextLength: number = 0): ModelConfig {
  const sectionType = detectSectionType(sectionTitle);
  const sectionComplexity = calculateComplexity(sectionTitle, sectionType);
  
  // Additional complexity boost for large context
  let contextComplexity = 0;
  if (contextLength > 50000) {
    contextComplexity = 0.2;
  } else if (contextLength > 20000) {
    contextComplexity = 0.1;
  }
  
  const overallComplexity = Math.min(sectionComplexity + contextComplexity, 1.0);
  
  console.log(`Model selection for "${sectionTitle}" - Type: ${sectionType}, Complexity: ${overallComplexity.toFixed(2)}`);
  
  // Tiered selection based on complexity
  if (overallComplexity >= 0.75) {
    console.log(`  → Using HIGH tier: ${MODELS.HIGH.displayName}`);
    return MODELS.HIGH;
  } else if (overallComplexity >= 0.45) {
    console.log(`  → Using MEDIUM tier: ${MODELS.MEDIUM.displayName}`);
    return MODELS.MEDIUM;
  } else {
    console.log(`  → Using LOW tier: ${MODELS.LOW.displayName}`);
    return MODELS.LOW;
  }
}

/**
 * Calculate cost savings metrics for tracking
 */
export function calculateCostMetrics(modelUsed: string): CostMetrics {
  const opusCost = MODEL_COSTS['claude-opus-4-1-20250805'];
  const actualCost = MODEL_COSTS[modelUsed] || opusCost;
  const costReduction = Math.round((1 - (actualCost / opusCost)) * 100);
  
  return {
    modelUsed,
    costTier: actualCost <= 0.15 ? 'low' : actualCost <= 0.35 ? 'medium' : 'high',
    estimatedCostReduction: costReduction
  };
}

/**
 * Get aggregated cost statistics for a set of model usages
 */
export function aggregateCostStats(modelUsages: string[]): {
  totalSections: number;
  modelsUsed: { [key: string]: number };
  avgCostReduction: number;
  tierDistribution: { low: number; medium: number; high: number };
} {
  const modelsUsed: { [key: string]: number } = {};
  let totalCostReduction = 0;
  const tierDistribution = { low: 0, medium: 0, high: 0 };
  
  for (const model of modelUsages) {
    modelsUsed[model] = (modelsUsed[model] || 0) + 1;
    
    const metrics = calculateCostMetrics(model);
    totalCostReduction += metrics.estimatedCostReduction;
    tierDistribution[metrics.costTier as keyof typeof tierDistribution]++;
  }
  
  return {
    totalSections: modelUsages.length,
    modelsUsed,
    avgCostReduction: modelUsages.length > 0 ? Math.round(totalCostReduction / modelUsages.length) : 0,
    tierDistribution
  };
}
