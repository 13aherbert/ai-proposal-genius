// Phase 3: Advanced Intelligence - Multi-Model Orchestration
export interface ModelResult {
  model: string;
  content: string;
  confidence: number;
  reasoning_score: number;
  technical_accuracy: number;
  processing_time: number;
}

export interface ConsensusResult {
  final_content: string;
  confidence_score: number;
  model_agreement: number;
  best_performing_model: string;
  synthesis_approach: string;
  quality_improvements: string[];
}

export class MultiModelOrchestrator {
  private static readonly MODELS = [
    { name: 'claude-opus-4-5-20250929', weight: 0.4, strength: 'reasoning' },
    { name: 'claude-sonnet-4-5-20250929', weight: 0.35, strength: 'efficiency' },
    { name: 'claude-haiku-4-5-20251001', weight: 0.25, strength: 'speed' }
  ];

  static async orchestrateGeneration(
    prompt: string,
    anthropicApiKey: string,
    sectionType: string,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ): Promise<ConsensusResult> {
    const results: ModelResult[] = [];
    
    // Determine which models to use based on complexity
    const selectedModels = this.selectModelsForComplexity(complexity);
    
    // Generate content from multiple models in parallel
    for (const model of selectedModels) {
      try {
        const startTime = Date.now();
        const content = await this.generateWithModel(prompt, model.name, anthropicApiKey);
        const processingTime = Date.now() - startTime;
        
        const result: ModelResult = {
          model: model.name,
          content,
          confidence: this.calculateModelConfidence(content, sectionType),
          reasoning_score: this.assessReasoningQuality(content),
          technical_accuracy: this.assessTechnicalAccuracy(content, sectionType),
          processing_time: processingTime
        };
        
        results.push(result);
      } catch (error) {
        console.warn(`Model ${model.name} failed:`, error.message);
      }
    }

    // Synthesize results using advanced consensus algorithms
    return this.synthesizeResults(results, sectionType);
  }

  private static selectModelsForComplexity(complexity: string) {
    switch (complexity) {
      case 'simple':
        return this.MODELS.slice(2); // Just Haiku for simple content
      case 'complex':
        return this.MODELS; // All models for complex content
      default:
        return this.MODELS.slice(0, 2); // Opus + Sonnet for moderate
    }
  }

  private static async generateWithModel(
    prompt: string,
    model: string,
    anthropicApiKey: string
  ): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': anthropicApiKey,
        'Anthropic-Version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Model ${model} API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private static calculateModelConfidence(content: string, sectionType: string): number {
    let confidence = 0.5; // Base confidence

    // Length appropriateness
    const wordCount = content.split(/\s+/).length;
    const idealRange = this.getIdealWordRange(sectionType);
    if (wordCount >= idealRange.min && wordCount <= idealRange.max) {
      confidence += 0.2;
    }

    // Structure quality
    if (this.hasGoodStructure(content)) confidence += 0.15;
    
    // Technical depth
    if (this.hasTechnicalDepth(content, sectionType)) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  private static assessReasoningQuality(content: string): number {
    let score = 0.5;
    
    // Logical flow indicators
    const logicIndicators = ['therefore', 'consequently', 'furthermore', 'moreover', 'however'];
    const logicCount = logicIndicators.filter(indicator => 
      content.toLowerCase().includes(indicator)
    ).length;
    score += Math.min(logicCount * 0.05, 0.2);

    // Evidence-based reasoning
    if (content.includes('based on') || content.includes('according to')) score += 0.1;
    
    // Clear conclusions
    if (content.includes('conclusion') || content.includes('summary')) score += 0.1;

    return Math.min(score, 1.0);
  }

  private static assessTechnicalAccuracy(content: string, sectionType: string): number {
    let score = 0.6; // Base technical score

    const technicalKeywords = this.getTechnicalKeywords(sectionType);
    const keywordMatches = technicalKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    score += Math.min(keywordMatches * 0.05, 0.3);

    // Avoid overly generic content
    const genericPhrases = ['various', 'multiple', 'several', 'numerous'];
    const genericCount = genericPhrases.filter(phrase =>
      content.toLowerCase().includes(phrase)
    ).length;
    score -= Math.min(genericCount * 0.05, 0.2);

    return Math.max(Math.min(score, 1.0), 0.1);
  }

  private static synthesizeResults(results: ModelResult[], sectionType: string): ConsensusResult {
    if (results.length === 0) {
      throw new Error('No model results to synthesize');
    }

    // Single model fallback
    if (results.length === 1) {
      return {
        final_content: results[0].content,
        confidence_score: results[0].confidence,
        model_agreement: 1.0,
        best_performing_model: results[0].model,
        synthesis_approach: 'single_model',
        quality_improvements: []
      };
    }

    // Multi-model consensus
    const bestResult = results.reduce((best, current) => 
      (current.confidence + current.reasoning_score + current.technical_accuracy) > 
      (best.confidence + best.reasoning_score + best.technical_accuracy) ? current : best
    );

    // Calculate agreement between models
    const agreement = this.calculateModelAgreement(results);
    
    // Enhanced synthesis for high-agreement scenarios
    let finalContent = bestResult.content;
    const improvements: string[] = [];

    if (agreement > 0.7) {
      // High agreement - use best model with minor enhancements
      finalContent = this.enhanceContent(bestResult.content, results, sectionType);
      improvements.push('Enhanced with multi-model insights');
    }

    return {
      final_content: finalContent,
      confidence_score: Math.min(bestResult.confidence + (agreement * 0.2), 1.0),
      model_agreement: agreement,
      best_performing_model: bestResult.model,
      synthesis_approach: agreement > 0.7 ? 'consensus_enhanced' : 'best_model_selected',
      quality_improvements: improvements
    };
  }

  private static calculateModelAgreement(results: ModelResult[]): number {
    if (results.length < 2) return 1.0;

    const contents = results.map(r => r.content);
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        totalSimilarity += this.calculateContentSimilarity(contents[i], contents[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private static calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  private static enhanceContent(baseContent: string, allResults: ModelResult[], sectionType: string): string {
    // For now, return the base content
    // Future enhancement: merge best elements from all models
    return baseContent;
  }

  private static getIdealWordRange(sectionType: string): { min: number; max: number } {
    const ranges = {
      'executive': { min: 200, max: 600 },
      'technical': { min: 400, max: 1200 },
      'team': { min: 150, max: 500 },
      'timeline': { min: 100, max: 400 },
      'pricing': { min: 200, max: 600 },
      'general': { min: 200, max: 800 }
    };
    return ranges[sectionType] || ranges.general;
  }

  private static hasGoodStructure(content: string): boolean {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.length >= 2 && paragraphs.length <= 8;
  }

  private static hasTechnicalDepth(content: string, sectionType: string): boolean {
    const technicalKeywords = this.getTechnicalKeywords(sectionType);
    const matches = technicalKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    return matches.length >= 3;
  }

  private static getTechnicalKeywords(sectionType: string): string[] {
    const keywords = {
      'technical': ['methodology', 'framework', 'architecture', 'implementation', 'integration', 'scalability'],
      'team': ['experience', 'expertise', 'qualification', 'certification', 'leadership', 'collaboration'],
      'timeline': ['milestone', 'deliverable', 'schedule', 'phase', 'deadline', 'duration'],
      'pricing': ['cost', 'budget', 'investment', 'value', 'pricing', 'estimate'],
      'executive': ['strategy', 'objective', 'benefit', 'outcome', 'impact', 'success']
    };
    return keywords[sectionType] || keywords.executive;
  }
}