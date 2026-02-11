// Tiered model selection for AI cost optimization via Lovable AI Gateway
// Uses Gemini models for optimal cost/quality balance

export interface ModelConfig {
  model: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
  displayName: string;
}

export interface CostMetrics {
  modelUsed: string;
  costTier: string;
  estimatedCostReduction: number;
}

// Model tiers using Gemini via Lovable AI Gateway
const MODELS = {
  HIGH: {
    model: 'google/gemini-2.5-pro',
    maxTokens: 2500,
    costTier: 'high' as const,
    displayName: 'Gemini 2.5 Pro (High Quality)'
  },
  MEDIUM: {
    model: 'google/gemini-2.5-flash',
    maxTokens: 1500,
    costTier: 'medium' as const,
    displayName: 'Gemini 2.5 Flash (Balanced)'
  },
  LOW: {
    model: 'google/gemini-2.5-flash-lite',
    maxTokens: 1200,
    costTier: 'low' as const,
    displayName: 'Gemini 2.5 Flash Lite (Fast & Efficient)'
  }
};

// Relative cost of each model (Pro = 1.0 baseline)
const MODEL_COSTS: { [key: string]: number } = {
  'google/gemini-2.5-pro': 1.0,
  'google/gemini-2.5-flash': 0.35,
  'google/gemini-2.5-flash-lite': 0.10
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

const COMPLEXITY_INDICATORS = [
  'strategy', 'approach', 'methodology', 'analysis', 'evaluation',
  'implementation', 'comprehensive', 'detailed', 'advanced', 'complex',
  'integration', 'architecture', 'framework', 'optimization'
];

export function detectSectionType(sectionTitle: string): string {
  const titleLower = sectionTitle.toLowerCase();
  for (const [type, patterns] of Object.entries(SECTION_TYPE_PATTERNS)) {
    if (patterns.some(pattern => titleLower.includes(pattern))) {
      return type;
    }
  }
  return 'general';
}

function calculateComplexity(sectionTitle: string, sectionType: string): number {
  const baseComplexity: { [key: string]: number } = {
    executive: 0.9,
    technical: 0.8,
    pricing: 0.6,
    timeline: 0.5,
    team: 0.4,
    company: 0.3,
    general: 0.5
  };

  let complexity = baseComplexity[sectionType] || 0.5;

  const titleWords = sectionTitle.split(/\s+/).length;
  if (titleWords > 6) complexity += 0.1;

  const titleLower = sectionTitle.toLowerCase();
  if (COMPLEXITY_INDICATORS.some(i => titleLower.includes(i))) complexity += 0.15;

  return Math.min(complexity, 1.0);
}

export function selectOptimalModel(sectionTitle: string, contextLength: number = 0): ModelConfig {
  const sectionType = detectSectionType(sectionTitle);
  const sectionComplexity = calculateComplexity(sectionTitle, sectionType);

  let contextComplexity = 0;
  if (contextLength > 50000) contextComplexity = 0.2;
  else if (contextLength > 20000) contextComplexity = 0.1;

  const overallComplexity = Math.min(sectionComplexity + contextComplexity, 1.0);

  console.log(`Model selection for "${sectionTitle}" - Type: ${sectionType}, Complexity: ${overallComplexity.toFixed(2)}`);

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

export function calculateCostMetrics(modelUsed: string): CostMetrics {
  const proCost = MODEL_COSTS['google/gemini-2.5-pro'] || 1.0;
  const actualCost = MODEL_COSTS[modelUsed] || proCost;
  const costReduction = Math.round((1 - (actualCost / proCost)) * 100);

  return {
    modelUsed,
    costTier: actualCost <= 0.15 ? 'low' : actualCost <= 0.5 ? 'medium' : 'high',
    estimatedCostReduction: costReduction
  };
}

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
