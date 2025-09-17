export interface QualityMetrics {
  overall_score: number;
  readability_score: number;
  persuasiveness_score: number;
  technical_depth_score: number;
  client_focus_score: number;
  evidence_score: number;
  issues: string[];
  recommendations: string[];
}

export interface QualityAnalysis {
  metrics: QualityMetrics;
  passes_threshold: boolean;
  requires_revision: boolean;
}

/**
 * Analyzes content quality across multiple dimensions for proposal excellence
 */
export class ContentQualityAnalyzer {
  private static readonly QUALITY_THRESHOLD = 75;
  
  static analyzeContent(content: string, sectionType: string, requirements?: string): QualityAnalysis {
    const metrics = this.calculateQualityMetrics(content, sectionType, requirements);
    const passesThreshold = metrics.overall_score >= this.QUALITY_THRESHOLD;
    
    return {
      metrics,
      passes_threshold: passesThreshold,
      requires_revision: !passesThreshold || metrics.issues.length > 2
    };
  }
  
  private static calculateQualityMetrics(content: string, sectionType: string, requirements?: string): QualityMetrics {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 1. Readability Analysis (25 points)
    const readabilityScore = this.analyzeReadability(content, issues, recommendations);
    
    // 2. Persuasiveness Analysis (25 points) 
    const persuasivenessScore = this.analyzePersuasiveness(content, issues, recommendations);
    
    // 3. Technical Depth Analysis (20 points)
    const technicalScore = this.analyzeTechnicalDepth(content, sectionType, issues, recommendations);
    
    // 4. Client Focus Analysis (15 points)
    const clientFocusScore = this.analyzeClientFocus(content, issues, recommendations);
    
    // 5. Evidence & Proof Analysis (15 points)
    const evidenceScore = this.analyzeEvidence(content, issues, recommendations);
    
    const overallScore = Math.round(
      (readabilityScore * 0.25) + 
      (persuasivenessScore * 0.25) + 
      (technicalScore * 0.20) + 
      (clientFocusScore * 0.15) + 
      (evidenceScore * 0.15)
    );
    
    return {
      overall_score: overallScore,
      readability_score: readabilityScore,
      persuasiveness_score: persuasivenessScore,
      technical_depth_score: technicalScore,
      client_focus_score: clientFocusScore,
      evidence_score: evidenceScore,
      issues,
      recommendations
    };
  }
  
  private static analyzeReadability(content: string, issues: string[], recommendations: string[]): number {
    let score = 100;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Check sentence length
    if (avgWordsPerSentence > 25) {
      score -= 20;
      issues.push("Sentences are too long (average >25 words)");
      recommendations.push("Break long sentences into shorter, punchier statements");
    }
    
    // Check paragraph structure
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => p.split(/[.!?]+/).length > 4);
    
    if (longParagraphs.length > paragraphs.length * 0.3) {
      score -= 15;
      issues.push("Too many long paragraphs (>4 sentences)");
      recommendations.push("Keep paragraphs to 2-3 sentences for better readability");
    }
    
    // Check for passive voice (basic detection)
    const passivePatterns = /\b(is|are|was|were|being|been)\s+\w+ed\b/gi;
    const passiveCount = (content.match(passivePatterns) || []).length;
    const passiveRatio = passiveCount / sentences.length;
    
    if (passiveRatio > 0.2) {
      score -= 10;
      issues.push("Too much passive voice detected");
      recommendations.push("Use more active voice for stronger impact");
    }
    
    return Math.max(0, score);
  }
  
  private static analyzePersuasiveness(content: string, issues: string[], recommendations: string[]): number {
    let score = 100;
    
    // Check for balanced quantitative evidence (not excessive)
    const numberPattern = /\d+(\.\d+)?%?/g;
    const numbers = content.match(numberPattern) || [];
    
    if (numbers.length === 0) {
      score -= 15;
      issues.push("Lacks supporting quantitative evidence");
      recommendations.push("Add 1-2 key metrics or measurable outcomes for credibility");
    } else if (numbers.length > 5) {
      score -= 20;
      issues.push("Excessive statistics may overwhelm the message");
      recommendations.push("Focus on 2-3 most compelling metrics rather than overwhelming with numbers");
    }
    
    // Check for benefit statements and value propositions
    const benefitPatterns = [
      /\b(save|reduce|increase|improve|enhance|deliver|achieve|enable|optimize)\b/gi,
      /\b(ROI|return on investment|cost savings|efficiency|performance|value|benefit)\b/gi
    ];
    
    const benefitCount = benefitPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
    
    if (benefitCount < 3) {
      score -= 20;
      issues.push("Insufficient benefit-focused language");
      recommendations.push("Emphasize client benefits and value propositions more strongly");
    }

    // Check for client-centric persuasive elements
    const persuasiveElements = [
      /\b(guarantee|ensure|proven|demonstrated|validated)\b/gi,
      /\b(success|results|outcomes|solution|expertise)\b/gi
    ];
    
    const persuasiveCount = persuasiveElements.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);
    
    if (persuasiveCount < 2) {
      score -= 15;
      issues.push("Lacks persuasive confidence indicators");
      recommendations.push("Use more confident language that demonstrates proven expertise");
    }
    
    // Check for weak language
    const weakPatterns = /\b(might|maybe|perhaps|possibly|we believe|we think|would try)\b/gi;
    const weakLanguage = content.match(weakPatterns) || [];
    
    if (weakLanguage.length > 0) {
      score -= 15;
      issues.push("Contains weak or tentative language");
      recommendations.push("Use confident, definitive language to project expertise");
    }
    
    // Check for compelling opening that addresses RFP
    const firstSentence = content.split(/[.!?]/)[0];
    const hasStrongOpening = /\b(deliver|achieve|guarantee|ensure|provide|address|solve)\b/i.test(firstSentence) ||
                           /\b(understanding|requirements|challenges|needs)\b/i.test(firstSentence);
    
    if (!hasStrongOpening) {
      score -= 15;
      issues.push("Opening lacks impact and direct response to RFP needs");
      recommendations.push("Start by directly addressing the RFP requirement or client challenge");
    }

    // Penalize repetitive language patterns
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const repetitiveStarts = this.detectRepetitivePatterns(sentences);
    
    if (repetitiveStarts > 0) {
      score -= repetitiveStarts * 5;
      issues.push("Content contains repetitive sentence patterns");
      recommendations.push("Vary sentence structures and openings for better engagement");
    }
    
    return Math.max(0, score);
  }

  private static detectRepetitivePatterns(sentences: string[]): number {
    const startPatterns: { [key: string]: number } = {};
    
    sentences.forEach(sentence => {
      const firstTwoWords = sentence.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      if (firstTwoWords.length > 3) {
        startPatterns[firstTwoWords] = (startPatterns[firstTwoWords] || 0) + 1;
      }
    });
    
    return Object.values(startPatterns).filter(count => count > 1).length;
  }
  
  private static analyzeTechnicalDepth(content: string, sectionType: string, issues: string[], recommendations: string[]): number {
    let score = 100;
    
    if (sectionType === 'technical') {
      // Technical sections need methodology and specifics
      const methodologyPatterns = /\b(methodology|approach|framework|process|implementation|strategy)\b/gi;
      const methodologyCount = (content.match(methodologyPatterns) || []).length;
      
      if (methodologyCount < 2) {
        score -= 30;
        issues.push("Technical section lacks clear methodology or approach");
        recommendations.push("Detail your technical approach and implementation methodology");
      }
      
      // Check for technical tools/technologies
      const techPatterns = /\b([A-Z]{2,}|[A-Z][a-z]+(?:[A-Z][a-z]*)*)\b/g;
      const techTerms = content.match(techPatterns) || [];
      
      if (techTerms.length < 3) {
        score -= 20;
        issues.push("Insufficient technical specificity");
        recommendations.push("Include specific technologies, tools, or frameworks");
      }
    }
    
    return Math.max(0, score);
  }
  
  private static analyzeClientFocus(content: string, issues: string[], recommendations: string[]): number {
    let score = 100;
    
    // Count client-focused vs. company-focused language
    const clientPatterns = /\b(you|your|client|customer|organization)\b/gi;
    const companyPatterns = /\b(we|our|us|company|firm)\b/gi;
    
    const clientCount = (content.match(clientPatterns) || []).length;
    const companyCount = (content.match(companyPatterns) || []).length;
    
    const clientFocusRatio = clientCount / (clientCount + companyCount);
    
    if (clientFocusRatio < 0.4) {
      score -= 25;
      issues.push("Content is too company-focused rather than client-focused");
      recommendations.push("Reframe content to emphasize client benefits and outcomes");
    }
    
    // Check for outcome statements
    const outcomePatterns = /\b(will|ensure|guarantee|deliver|achieve|result in)\b/gi;
    const outcomeCount = (content.match(outcomePatterns) || []).length;
    
    if (outcomeCount < 2) {
      score -= 15;
      issues.push("Lacks clear outcome statements");
      recommendations.push("Include specific outcomes and results the client will achieve");
    }
    
    return Math.max(0, score);
  }
  
  private static analyzeEvidence(content: string, issues: string[], recommendations: string[]): number {
    let score = 100;
    
    // Check for concrete examples
    const examplePatterns = /\b(for example|such as|including|specifically|demonstrated)\b/gi;
    const exampleCount = (content.match(examplePatterns) || []).length;
    
    if (exampleCount === 0) {
      score -= 30;
      issues.push("Lacks concrete examples or proof points");
      recommendations.push("Add specific examples from past projects or case studies");
    }
    
    // Check for time-based evidence
    const timePatterns = /\b(within|in \d+|by|during|completed)\b/gi;
    const timeCount = (content.match(timePatterns) || []).length;
    
    if (timeCount === 0) {
      score -= 20;
      issues.push("Missing timeline or delivery commitments");
      recommendations.push("Include specific timeframes and delivery commitments");
    }
    
    return Math.max(0, score);
  }
  
  static getQualityThreshold(): number {
    return this.QUALITY_THRESHOLD;
  }
}