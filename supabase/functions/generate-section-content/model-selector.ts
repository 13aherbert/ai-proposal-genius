// Smart model selection for cost optimization via Lovable AI Gateway
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
  
  if (overallComplexity >= 0.8) {
    return {
      model: 'google/gemini-2.5-pro',
      maxTokens: 2000,
      costTier: 'high'
    };
  } else if (overallComplexity >= 0.5) {
    return {
      model: 'google/gemini-2.5-flash',
      maxTokens: 1500,
      costTier: 'medium'
    };
  } else {
    return {
      model: 'google/gemini-2.5-flash-lite',
      maxTokens: 1200,
      costTier: 'low'
    };
  }
}

function calculateSectionComplexity(sectionType: string, sectionTitle: string): number {
  const sectionComplexityMap: { [key: string]: number } = {
    executive: 0.9,
    technical: 0.8,
    company: 0.3,
    team: 0.4,
    pricing: 0.6,
    timeline: 0.5,
    general: 0.4
  };
  
  let complexity = sectionComplexityMap[sectionType] || 0.4;
  
  const titleWords = sectionTitle.split(/\s+/).length;
  if (titleWords > 6) complexity += 0.1;
  
  const complexityIndicators = [
    'strategy', 'approach', 'methodology', 'analysis', 'evaluation', 
    'implementation', 'comprehensive', 'detailed', 'advanced'
  ];
  
  if (complexityIndicators.some(i => sectionTitle.toLowerCase().includes(i))) {
    complexity += 0.2;
  }
  
  return Math.min(complexity, 1.0);
}

function calculateContentComplexity(contentLength: number): number {
  if (contentLength > 50000) return 0.9;
  if (contentLength > 20000) return 0.7;
  if (contentLength > 5000) return 0.5;
  return 0.3;
}

export function getModelDisplayName(model: string): string {
  const modelNames: { [key: string]: string } = {
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro (High Quality)',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash (Balanced)',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite (Fast & Efficient)'
  };
  return modelNames[model] || model;
}

export function estimateCostReduction(oldModel: string, newModel: string): number {
  const modelCosts: { [key: string]: number } = {
    'google/gemini-2.5-pro': 1.0,
    'google/gemini-2.5-flash': 0.35,
    'google/gemini-2.5-flash-lite': 0.10
  };
  
  const oldCost = modelCosts[oldModel] || 1.0;
  const newCost = modelCosts[newModel] || 1.0;
  
  return Math.round((1 - (newCost / oldCost)) * 100);
}
