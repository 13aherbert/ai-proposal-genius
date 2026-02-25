// Phase 3: Advanced Intelligence - Multi-Model Orchestration via Anthropic Claude
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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
  // Use Claude Sonnet as the primary model for all proposal content
  private static readonly PRIMARY_MODEL = 'claude-sonnet-4-20250514';

  static async orchestrateGeneration(
    prompt: string,
    _apiKey: string, // kept for interface compatibility, uses ANTHROPIC_API_KEY from env
    sectionType: string,
    complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ): Promise<ConsensusResult> {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const startTime = Date.now();
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const content = await this.generateWithClaude(prompt, anthropicKey, this.PRIMARY_MODEL);
        const processingTime = Date.now() - startTime;

        const result: ModelResult = {
          model: this.PRIMARY_MODEL,
          content,
          confidence: this.calculateModelConfidence(content, sectionType),
          reasoning_score: this.assessReasoningQuality(content),
          technical_accuracy: this.assessTechnicalAccuracy(content, sectionType),
          processing_time: processingTime
        };

        console.log(`Claude Sonnet generated content in ${processingTime}ms, confidence: ${result.confidence.toFixed(2)}`);

        return {
          final_content: result.content,
          confidence_score: result.confidence,
          model_agreement: 1.0,
          best_performing_model: this.PRIMARY_MODEL,
          synthesis_approach: 'claude_sonnet_primary',
          quality_improvements: [`Generated with ${this.PRIMARY_MODEL} (complexity: ${complexity})`]
        };
      } catch (error) {
        const isOverloaded = error.message?.includes('529') || error.message?.includes('Overloaded');
        const isRateLimit = error.message?.includes('429') || error.message?.includes('rate limit');
        const isRetryable = isOverloaded || isRateLimit;

        console.error(`Claude Sonnet attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff: 3s, 6s, 12s + jitter
        const delay = (3000 * Math.pow(2, attempt - 1)) + Math.random() * 2000;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('All retry attempts exhausted');
  }

  private static async generateWithClaude(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      if (response.status === 529) {
        throw new Error('Anthropic API overloaded (529), will retry...');
      }
      if (response.status === 429) {
        throw new Error('Anthropic rate limits exceeded (429), will retry...');
      }
      if (response.status === 402) {
        throw new Error('Anthropic payment required, please check your billing.');
      }
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private static calculateModelConfidence(content: string, sectionType: string): number {
    let confidence = 0.5;
    const wordCount = content.split(/\s+/).length;
    const idealRange = this.getIdealWordRange(sectionType);
    if (wordCount >= idealRange.min && wordCount <= idealRange.max) confidence += 0.2;
    if (this.hasGoodStructure(content)) confidence += 0.15;
    if (this.hasTechnicalDepth(content, sectionType)) confidence += 0.15;
    return Math.min(confidence, 1.0);
  }

  private static assessReasoningQuality(content: string): number {
    let score = 0.5;
    const logicIndicators = ['therefore', 'consequently', 'furthermore', 'moreover', 'however'];
    const logicCount = logicIndicators.filter(i => content.toLowerCase().includes(i)).length;
    score += Math.min(logicCount * 0.05, 0.2);
    if (content.includes('based on') || content.includes('according to')) score += 0.1;
    if (content.includes('conclusion') || content.includes('summary')) score += 0.1;
    return Math.min(score, 1.0);
  }

  private static assessTechnicalAccuracy(content: string, sectionType: string): number {
    let score = 0.6;
    const technicalKeywords = this.getTechnicalKeywords(sectionType);
    const keywordMatches = technicalKeywords.filter(k => content.toLowerCase().includes(k.toLowerCase())).length;
    score += Math.min(keywordMatches * 0.05, 0.3);
    const genericPhrases = ['various', 'multiple', 'several', 'numerous'];
    const genericCount = genericPhrases.filter(p => content.toLowerCase().includes(p)).length;
    score -= Math.min(genericCount * 0.05, 0.2);
    return Math.max(Math.min(score, 1.0), 0.1);
  }

  private static getIdealWordRange(sectionType: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
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
    return technicalKeywords.filter(k => content.toLowerCase().includes(k.toLowerCase())).length >= 3;
  }

  private static getTechnicalKeywords(sectionType: string): string[] {
    const keywords: Record<string, string[]> = {
      'technical': ['methodology', 'framework', 'architecture', 'implementation', 'integration', 'scalability'],
      'team': ['experience', 'expertise', 'qualification', 'certification', 'leadership', 'collaboration'],
      'timeline': ['milestone', 'deliverable', 'schedule', 'phase', 'deadline', 'duration'],
      'pricing': ['cost', 'budget', 'investment', 'value', 'pricing', 'estimate'],
      'executive': ['strategy', 'objective', 'benefit', 'outcome', 'impact', 'success']
    };
    return keywords[sectionType] || keywords.executive;
  }
}