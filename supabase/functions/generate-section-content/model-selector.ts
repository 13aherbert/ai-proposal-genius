// Smart model selection for cost optimization
export interface ModelConfig {
  model: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
}

export function selectOptimalModel(sectionType: string, sectionTitle: string, contentLength: number): ModelConfig {
  const sectionComplexity = calculateSectionComplexity(sectionType, sectionTitle);
  const contentComplexity = calculateContentComplexity(contentLength);
  
  const overallComplexity = Math.max(sectionComplexity, contentComplexity);
  
  console.log(`Model selection - Section: ${sectionComplexity}, Content: ${contentComplexity}, Overall: ${overallComplexity}`);
  
  // Tiered model selection for cost optimization
  if (overallComplexity >= 0.8) {
    // High complexity: Use most capable model
    return {
      model: 'claude-sonnet-4-5-20250929',  // High-performance Claude Sonnet 4.5
      maxTokens: 2000,
      costTier: 'high'
    };
  } else if (overallComplexity >= 0.5) {
    // Medium complexity: Use balanced model  
    return {
      model: 'claude-sonnet-4-5-20250929', // Good balance of quality and cost
      maxTokens: 1500,
      costTier: 'medium'
    };
  } else {
    // Low complexity: Use fastest, cheapest model
    return {
      model: 'claude-haiku-4-5-20251001',  // Fast and cost-effective Claude Haiku 4.5
      maxTokens: 1200,
      costTier: 'low'
    };
  }
}

function calculateSectionComplexity(sectionType: string, sectionTitle: string): number {
  // Base complexity by section type
  const sectionComplexityMap: { [key: string]: number } = {
    executive: 0.9,    // Requires strategic thinking and synthesis
    technical: 0.8,    // Needs technical accuracy and detail
    company: 0.3,      // Straightforward factual content
    team: 0.4,         // Factual with some narrative
    pricing: 0.6,      // Requires careful calculation and justification
    timeline: 0.5,     // Structured but straightforward
    general: 0.4       // Standard complexity
  };
  
  let complexity = sectionComplexityMap[sectionType] || 0.4;
  
  // Adjust based on section title complexity
  const titleWords = sectionTitle.split(/\s+/).length;
  if (titleWords > 6) {
    complexity += 0.1; // More complex sections tend to have longer titles
  }
  
  // Check for complexity indicators in title
  const complexityIndicators = [
    'strategy', 'approach', 'methodology', 'analysis', 'evaluation', 
    'implementation', 'comprehensive', 'detailed', 'advanced'
  ];
  
  const hasComplexityIndicators = complexityIndicators.some(indicator => 
    sectionTitle.toLowerCase().includes(indicator)
  );
  
  if (hasComplexityIndicators) {
    complexity += 0.2;
  }
  
  return Math.min(complexity, 1.0);
}

function calculateContentComplexity(contentLength: number): number {
  // Content complexity based on available context length
  if (contentLength > 50000) {
    return 0.9; // Very large context requires powerful model
  } else if (contentLength > 20000) {
    return 0.7; // Large context needs good comprehension
  } else if (contentLength > 5000) {
    return 0.5; // Medium context is manageable
  } else {
    return 0.3; // Small context is simple
  }
}

export function getModelDisplayName(model: string): string {
  const modelNames: { [key: string]: string } = {
    'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5 (High Quality)',
    'claude-haiku-4-5-20251001': 'Claude Haiku 4.5 (Fast & Efficient)'
  };
  
  return modelNames[model] || model;
}

export function estimateCostReduction(oldModel: string, newModel: string): number {
  // Rough cost estimates (relative to Claude Opus = 1.0)
  const modelCosts: { [key: string]: number } = {
    'claude-opus-4-5-20250929': 1.0,      // Most expensive
    'claude-sonnet-4-5-20250929': 0.6,    // 40% cheaper
    'claude-haiku-4-5-20251001': 0.2      // 80% cheaper
  };
  
  const oldCost = modelCosts[oldModel] || 1.0;
  const newCost = modelCosts[newModel] || 1.0;
  
  return Math.round((1 - (newCost / oldCost)) * 100);
}