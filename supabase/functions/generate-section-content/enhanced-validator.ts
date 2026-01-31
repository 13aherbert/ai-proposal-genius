export interface ValidationResult {
  is_valid: boolean;
  confidence_score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  requires_revision: boolean;
}

export interface ValidationIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: string;
  message: string;
  impact: string;
  suggestion: string;
}

/**
 * Enhanced content validation beyond basic checks
 */
export class EnhancedValidator {
  
  static validateContent(
    content: string, 
    sectionTitle: string, 
    sectionType: string, 
    requirements?: string
  ): ValidationResult {
    
    const issues: ValidationIssue[] = [];
    let confidenceScore = 100;
    
    // Run all validation checks
    confidenceScore -= this.validateLength(content, sectionType, issues);
    confidenceScore -= this.validateStructure(content, sectionType, issues);
    confidenceScore -= this.validateContentQuality(content, sectionType, issues);
    confidenceScore -= this.validateTone(content, issues);
    confidenceScore -= this.validateEvidence(content, issues);
    confidenceScore -= this.validateRequirements(content, requirements, issues);
    
    const criticalIssues = issues.filter(issue => issue.type === 'critical');
    const isValid = criticalIssues.length === 0 && confidenceScore >= 60;
    const requiresRevision = criticalIssues.length > 0 || confidenceScore < 70;
    
    return {
      is_valid: isValid,
      confidence_score: Math.max(0, confidenceScore),
      issues,
      recommendations: this.generateRecommendations(issues, confidenceScore),
      requires_revision: requiresRevision
    };
  }
  
  private static validateLength(content: string, sectionType: string, issues: ValidationIssue[]): number {
    let penalty = 0;
    const wordCount = content.split(/\s+/).length;
    const expectedRanges: Record<string, { min: number; max: number; optimal: number }> = {
      'executive': { min: 150, max: 400, optimal: 250 },
      'technical': { min: 200, max: 600, optimal: 350 },
      'team': { min: 150, max: 500, optimal: 300 },
      'pricing': { min: 100, max: 300, optimal: 200 },
      'timeline': { min: 100, max: 400, optimal: 250 },
      'general': { min: 100, max: 500, optimal: 300 }
    };
    
    const range = expectedRanges[sectionType] || expectedRanges['general'];
    
    if (wordCount < range.min) {
      penalty += 20;
      issues.push({
        type: 'critical',
        category: 'length',
        message: `Content too short (${wordCount} words, minimum ${range.min})`,
        impact: 'May appear incomplete or underdeveloped',
        suggestion: `Expand content to at least ${range.min} words with specific details and examples`
      });
    } else if (wordCount > range.max) {
      penalty += 10;
      issues.push({
        type: 'warning',
        category: 'length',
        message: `Content may be too long (${wordCount} words, maximum ${range.max})`,
        impact: 'May lose reader attention or exceed space limits',
        suggestion: `Consider condensing to ${range.max} words or fewer while maintaining key points`
      });
    }
    
    return penalty;
  }
  
  private static validateStructure(content: string, sectionType: string, issues: ValidationIssue[]): number {
    let penalty = 0;
    
    // Check paragraph structure
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length < 2) {
      penalty += 15;
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Content should be broken into multiple paragraphs',
        impact: 'Poor readability and visual organization',
        suggestion: 'Break content into 2-4 focused paragraphs with clear themes'
      });
    }
    
    // Check for logical flow
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const hasTransitions = sentences.some(sentence => 
      /\b(however|furthermore|additionally|moreover|therefore|consequently|in addition|as a result)\b/i.test(sentence)
    );
    
    if (sentences.length > 5 && !hasTransitions) {
      penalty += 10;
      issues.push({
        type: 'suggestion',
        category: 'structure',
        message: 'Content lacks transitional phrases for smooth flow',
        impact: 'May feel choppy or disconnected',
        suggestion: 'Add transition words to connect ideas and improve flow'
      });
    }
    
    // Section-specific structure requirements
    if (sectionType === 'executive') {
      const hasStrongOpening = /^[^.!?]*\b(deliver|achieve|provide|ensure|guarantee)\b/i.test(content);
      if (!hasStrongOpening) {
        penalty += 15;
        issues.push({
          type: 'warning',
          category: 'structure',
          message: 'Executive summary should start with a strong value statement',
          impact: 'Fails to immediately capture attention',
          suggestion: 'Begin with what you will deliver or achieve for the client'
        });
      }
    }
    
    return penalty;
  }
  
  private static validateContentQuality(content: string, sectionType: string, issues: ValidationIssue[]): number {
    let penalty = 0;
    
    // Check for placeholders or incomplete content
    const placeholderPatterns = [
      /\[.*?\]/g, /{{.*?}}/g, /\bTODO\b/gi, /\bTBD\b/gi, /\bXXX\b/gi,
      /\bINSERT\b/gi, /\bFILL\s*IN\b/gi, /\bCOMPANY\s*NAME\b/gi
    ];
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(content)) {
        penalty += 25;
        issues.push({
          type: 'critical',
          category: 'completeness',
          message: 'Content contains placeholder text or incomplete sections',
          impact: 'Appears unprofessional and incomplete',
          suggestion: 'Replace all placeholder text with actual content'
        });
        break;
      }
    }
    
    // Check for generic or vague language
    const vaguePhrases = [
      'best in class', 'world class', 'cutting edge', 'state of the art',
      'comprehensive solution', 'innovative approach', 'proven methodology'
    ];
    
    const vagueCount = vaguePhrases.filter(phrase => 
      new RegExp(`\\b${phrase}\\b`, 'gi').test(content)
    ).length;
    
    if (vagueCount > 2) {
      penalty += 10;
      issues.push({
        type: 'warning',
        category: 'specificity',
        message: 'Content contains too many generic business phrases',
        impact: 'Lacks concrete differentiation and specific value',
        suggestion: 'Replace generic phrases with specific capabilities and measurable outcomes'
      });
    }
    
    return penalty;
  }
  
  private static validateTone(content: string, issues: ValidationIssue[]): number {
    let penalty = 0;
    
    // Check for confidence level
    const uncertainPatterns = /\b(might|maybe|perhaps|possibly|could|would|should|try to|hope to)\b/gi;
    const uncertainMatches = content.match(uncertainPatterns) || [];
    
    if (uncertainMatches.length > 2) {
      penalty += 15;
      issues.push({
        type: 'warning',
        category: 'tone',
        message: 'Content contains uncertain or tentative language',
        impact: 'Projects lack of confidence in capabilities',
        suggestion: 'Use definitive language: will, ensure, deliver, provide, guarantee'
      });
    }
    
    // Check for appropriate formality
    const informalPatterns = /\b(gonna|wanna|yeah|okay|cool|awesome|guys)\b/gi;
    if (informalPatterns.test(content)) {
      penalty += 20;
      issues.push({
        type: 'critical',
        category: 'tone',
        message: 'Content contains informal language inappropriate for proposals',
        impact: 'Appears unprofessional',
        suggestion: 'Use professional business language throughout'
      });
    }
    
    return penalty;
  }
  
  private static validateEvidence(content: string, issues: ValidationIssue[]): number {
    let penalty = 0;
    
    // Check for quantitative evidence
    const numberPattern = /\d+(\.\d+)?%?/g;
    const numbers = content.match(numberPattern) || [];
    
    if (numbers.length === 0) {
      penalty += 15;
      issues.push({
        type: 'warning',
        category: 'evidence',
        message: 'Content lacks quantitative evidence or metrics',
        impact: 'Claims appear unsupported and less credible',
        suggestion: 'Include specific percentages, timeframes, or measurable outcomes'
      });
    }
    
    // Check for specific examples
    const examplePatterns = /\b(for example|such as|including|specifically|case study|project)\b/gi;
    const exampleCount = (content.match(examplePatterns) || []).length;
    
    if (exampleCount === 0) {
      penalty += 10;
      issues.push({
        type: 'suggestion',
        category: 'evidence',
        message: 'Content would benefit from specific examples',
        impact: 'Abstract claims are harder to believe',
        suggestion: 'Add concrete examples, case studies, or project references'
      });
    }
    
    return penalty;
  }
  
  private static validateRequirements(content: string, requirements?: string, issues?: ValidationIssue[]): number {
    if (!requirements || !issues) return 0;
    
    let penalty = 0;
    
    // Extract key requirement terms
    const requirementTerms = this.extractRequirementTerms(requirements);
    const contentLower = content.toLowerCase();
    
    const uncoveredTerms = requirementTerms.filter(term => 
      !contentLower.includes(term.toLowerCase())
    );
    
    if (uncoveredTerms.length > 0) {
      penalty += Math.min(20, uncoveredTerms.length * 5);
      issues.push({
        type: 'warning',
        category: 'requirements',
        message: `Content may not address key requirements: ${uncoveredTerms.slice(0, 3).join(', ')}`,
        impact: 'May not meet evaluator expectations',
        suggestion: 'Ensure content specifically addresses all stated requirements'
      });
    }
    
    return penalty;
  }
  
  private static extractRequirementTerms(requirements: string): string[] {
    const terms: string[] = [];
    
    // Look for must/shall/required statements
    const patterns = [
      /must\s+([\w\s]+?)(?:[.;]|\s+and|\s+or)/gi,
      /shall\s+([\w\s]+?)(?:[.;]|\s+and|\s+or)/gi,
      /required?\s+to\s+([\w\s]+?)(?:[.;]|\s+and|\s+or)/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(requirements)) !== null) {
        const term = match[1].trim();
        if (term.length > 5 && term.length < 50) {
          terms.push(term);
        }
      }
    }
    
    return terms.slice(0, 10); // Limit to most important terms
  }
  
  private static generateRecommendations(issues: ValidationIssue[], confidenceScore: number): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(issue => issue.type === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical issues immediately before submission');
    }
    
    if (confidenceScore < 70) {
      recommendations.push('Content requires significant revision to meet professional standards');
    } else if (confidenceScore < 85) {
      recommendations.push('Minor improvements would enhance content quality');
    }
    
    // Category-specific recommendations
    const categories = new Set(issues.map(issue => issue.category));
    
    if (categories.has('length')) {
      recommendations.push('Adjust content length to optimal range for section type');
    }
    
    if (categories.has('evidence')) {
      recommendations.push('Strengthen content with more quantitative evidence and examples');
    }
    
    if (categories.has('tone')) {
      recommendations.push('Ensure professional, confident tone throughout');
    }
    
    return recommendations;
  }
}