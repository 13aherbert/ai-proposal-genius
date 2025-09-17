import { KnowledgeEntry } from './types.ts';

export interface WinFactors {
  requirements_coverage: number;
  competitive_strength: number;
  proposal_quality: number;
  relationship_strength: number;
  price_competitiveness: number;
}

export interface WinProbabilityAnalysis {
  overall_probability: number;
  confidence_level: 'high' | 'medium' | 'low';
  win_factors: WinFactors;
  key_strengths: string[];
  risk_factors: string[];
  improvement_opportunities: string[];
}

/**
 * Calculates win probability based on multiple proposal and competitive factors
 */
export class WinProbabilityCalculator {
  
  static calculateWinProbability(
    knowledgeEntries: KnowledgeEntry[],
    rfpRequirements?: string,
    competitiveAnalysis?: any,
    qualityMetrics?: any
  ): WinProbabilityAnalysis {
    
    const winFactors = this.calculateWinFactors(
      knowledgeEntries, 
      rfpRequirements, 
      competitiveAnalysis, 
      qualityMetrics
    );
    
    const overallProbability = this.calculateOverallProbability(winFactors);
    const confidenceLevel = this.determineConfidenceLevel(winFactors, knowledgeEntries.length);
    
    return {
      overall_probability: overallProbability,
      confidence_level: confidenceLevel,
      win_factors: winFactors,
      key_strengths: this.identifyKeyStrengths(winFactors, competitiveAnalysis),
      risk_factors: this.identifyRiskFactors(winFactors),
      improvement_opportunities: this.identifyImprovementOpportunities(winFactors, knowledgeEntries)
    };
  }
  
  private static calculateWinFactors(
    knowledgeEntries: KnowledgeEntry[],
    rfpRequirements?: string,
    competitiveAnalysis?: any,
    qualityMetrics?: any
  ): WinFactors {
    
    return {
      requirements_coverage: this.assessRequirementsCoverage(knowledgeEntries, rfpRequirements),
      competitive_strength: this.assessCompetitiveStrength(competitiveAnalysis, knowledgeEntries),
      proposal_quality: this.assessProposalQuality(qualityMetrics, knowledgeEntries),
      relationship_strength: this.assessRelationshipStrength(knowledgeEntries),
      price_competitiveness: this.assessPriceCompetitiveness(knowledgeEntries, rfpRequirements)
    };
  }
  
  private static assessRequirementsCoverage(knowledgeEntries: KnowledgeEntry[], rfpRequirements?: string): number {
    if (!rfpRequirements) return 70; // Default moderate score without RFP
    
    const allContent = knowledgeEntries.map(entry => 
      (entry.content || '') + ' ' + (entry.parsed_content || '')
    ).join(' ').toLowerCase();
    
    // Extract key requirements
    const requirementPatterns = [
      /must\s+(?:have|provide|include|demonstrate)/gi,
      /required?\s+(?:to|:|is|are)/gi,
      /shall\s+(?:provide|include|demonstrate)/gi,
      /should\s+(?:have|provide|include)/gi
    ];
    
    let totalRequirements = 0;
    let coveredRequirements = 0;
    
    for (const pattern of requirementPatterns) {
      const matches = rfpRequirements.match(pattern) || [];
      totalRequirements += matches.length;
      
      for (const match of matches) {
        const context = this.extractRequirementContext(rfpRequirements, match);
        if (this.checkCoverage(allContent, context)) {
          coveredRequirements++;
        }
      }
    }
    
    if (totalRequirements === 0) return 70;
    
    const coverageRatio = coveredRequirements / totalRequirements;
    return Math.round(coverageRatio * 100);
  }
  
  private static assessCompetitiveStrength(competitiveAnalysis?: any, knowledgeEntries?: KnowledgeEntry[]): number {
    if (competitiveAnalysis?.differentiation_score) {
      return competitiveAnalysis.differentiation_score;
    }
    
    // Fallback assessment based on knowledge base
    let score = 50; // Base score
    
    if (knowledgeEntries) {
      const allContent = knowledgeEntries.map(entry => 
        (entry.content || '') + ' ' + (entry.parsed_content || '')
      ).join(' ').toLowerCase();
      
      // Look for competitive differentiators
      const strengthIndicators = [
        { pattern: /proprietary|unique|exclusive|patented/gi, points: 15 },
        { pattern: /certified|accredited|award|recognition/gi, points: 10 },
        { pattern: /\b(\d+)\+?\s*years?\s+experience/gi, points: 8 },
        { pattern: /industry\s+leader|market\s+leader/gi, points: 12 },
        { pattern: /partnership|strategic\s+alliance/gi, points: 8 }
      ];
      
      for (const { pattern, points } of strengthIndicators) {
        if (pattern.test(allContent)) {
          score += points;
        }
      }
    }
    
    return Math.min(100, score);
  }
  
  private static assessProposalQuality(qualityMetrics?: any, knowledgeEntries?: KnowledgeEntry[]): number {
    if (qualityMetrics?.overall_score) {
      return qualityMetrics.overall_score;
    }
    
    // Fallback assessment
    let score = 60; // Base score
    
    if (knowledgeEntries) {
      const totalContent = knowledgeEntries.reduce((total, entry) => 
        total + (entry.content?.length || 0) + (entry.parsed_content?.length || 0), 0
      );
      
      // Score based on knowledge base richness
      if (totalContent > 100000) score += 20;
      else if (totalContent > 50000) score += 15;
      else if (totalContent > 20000) score += 10;
      
      // Bonus for content variety
      const categories = new Set(knowledgeEntries.map(entry => entry.category));
      score += Math.min(15, categories.size * 3);
    }
    
    return Math.min(100, score);
  }
  
  private static assessRelationshipStrength(knowledgeEntries: KnowledgeEntry[]): number {
    let score = 50; // Base neutral score
    
    const allContent = knowledgeEntries.map(entry => 
      (entry.content || '') + ' ' + (entry.parsed_content || '')
    ).join(' ').toLowerCase();
    
    // Look for relationship indicators
    const relationshipIndicators = [
      { pattern: /existing\s+client|current\s+customer|ongoing\s+relationship/gi, points: 20 },
      { pattern: /previous\s+work|past\s+project|worked\s+with\s+before/gi, points: 15 },
      { pattern: /referral|recommendation|introduced\s+by/gi, points: 12 },
      { pattern: /partnership|strategic\s+relationship/gi, points: 10 },
      { pattern: /meeting|discussion|conversation|spoke\s+with/gi, points: 8 }
    ];
    
    for (const { pattern, points } of relationshipIndicators) {
      if (pattern.test(allContent)) {
        score += points;
        break; // Don't double-count relationship strength
      }
    }
    
    return Math.min(100, score);
  }
  
  private static assessPriceCompetitiveness(knowledgeEntries: KnowledgeEntry[], rfpRequirements?: string): number {
    let score = 60; // Assume competitive pricing by default
    
    const allContent = knowledgeEntries.map(entry => 
      (entry.content || '') + ' ' + (entry.parsed_content || '')
    ).join(' ').toLowerCase();
    
    // Look for pricing advantages
    const pricingAdvantages = [
      { pattern: /cost\s+savings|cost\s+reduction|save\s+money/gi, points: 15 },
      { pattern: /competitive\s+pricing|best\s+value|cost\s+effective/gi, points: 10 },
      { pattern: /fixed\s+price|no\s+surprises|transparent\s+pricing/gi, points: 8 },
      { pattern: /roi|return\s+on\s+investment|payback/gi, points: 12 }
    ];
    
    for (const { pattern, points } of pricingAdvantages) {
      if (pattern.test(allContent)) {
        score += points;
      }
    }
    
    // Check for budget constraints in RFP
    if (rfpRequirements?.toLowerCase().includes('budget') || 
        rfpRequirements?.toLowerCase().includes('cost')) {
      score -= 5; // Slight disadvantage if budget is a major factor
    }
    
    return Math.min(100, score);
  }
  
  private static calculateOverallProbability(winFactors: WinFactors): number {
    // Weighted average of win factors
    const weights = {
      requirements_coverage: 0.30,
      competitive_strength: 0.25,
      proposal_quality: 0.20,
      relationship_strength: 0.15,
      price_competitiveness: 0.10
    };
    
    const weightedScore = 
      (winFactors.requirements_coverage * weights.requirements_coverage) +
      (winFactors.competitive_strength * weights.competitive_strength) +
      (winFactors.proposal_quality * weights.proposal_quality) +
      (winFactors.relationship_strength * weights.relationship_strength) +
      (winFactors.price_competitiveness * weights.price_competitiveness);
    
    return Math.round(weightedScore);
  }
  
  private static determineConfidenceLevel(winFactors: WinFactors, knowledgeBaseSize: number): 'high' | 'medium' | 'low' {
    const avgScore = (
      winFactors.requirements_coverage + 
      winFactors.competitive_strength + 
      winFactors.proposal_quality + 
      winFactors.relationship_strength + 
      winFactors.price_competitiveness
    ) / 5;
    
    // Factor in knowledge base completeness
    const dataConfidence = knowledgeBaseSize > 10 ? 'high' : knowledgeBaseSize > 5 ? 'medium' : 'low';
    
    if (avgScore > 80 && dataConfidence === 'high') return 'high';
    if (avgScore > 60 && dataConfidence !== 'low') return 'medium';
    return 'low';
  }
  
  private static identifyKeyStrengths(winFactors: WinFactors, competitiveAnalysis?: any): string[] {
    const strengths: string[] = [];
    
    if (winFactors.requirements_coverage > 80) {
      strengths.push('Strong requirements coverage demonstrates clear fit');
    }
    
    if (winFactors.competitive_strength > 75) {
      strengths.push('Significant competitive advantages differentiate proposal');
    }
    
    if (winFactors.proposal_quality > 80) {
      strengths.push('High-quality proposal content enhances credibility');
    }
    
    if (winFactors.relationship_strength > 70) {
      strengths.push('Existing relationship provides competitive advantage');
    }
    
    if (winFactors.price_competitiveness > 75) {
      strengths.push('Competitive pricing and value proposition');
    }
    
    return strengths;
  }
  
  private static identifyRiskFactors(winFactors: WinFactors): string[] {
    const risks: string[] = [];
    
    if (winFactors.requirements_coverage < 60) {
      risks.push('Insufficient coverage of key RFP requirements');
    }
    
    if (winFactors.competitive_strength < 50) {
      risks.push('Limited competitive differentiation');
    }
    
    if (winFactors.proposal_quality < 60) {
      risks.push('Proposal quality may not meet expectations');
    }
    
    if (winFactors.relationship_strength < 40) {
      risks.push('No existing relationship with client');
    }
    
    if (winFactors.price_competitiveness < 50) {
      risks.push('Pricing may not be competitive');
    }
    
    return risks;
  }
  
  private static identifyImprovementOpportunities(winFactors: WinFactors, knowledgeEntries: KnowledgeEntry[]): string[] {
    const opportunities: string[] = [];
    
    if (winFactors.requirements_coverage < 80) {
      opportunities.push('Add more specific content addressing RFP requirements');
    }
    
    if (winFactors.competitive_strength < 70) {
      opportunities.push('Strengthen competitive positioning and unique value propositions');
    }
    
    if (winFactors.proposal_quality < 80) {
      opportunities.push('Enhance content quality with more evidence and examples');
    }
    
    if (knowledgeEntries.length < 5) {
      opportunities.push('Expand knowledge base with more comprehensive content');
    }
    
    return opportunities;
  }
  
  private static extractRequirementContext(rfpText: string, requirement: string): string {
    const sentences = rfpText.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.includes(requirement)) {
        return sentence.trim();
      }
    }
    return requirement;
  }
  
  private static checkCoverage(content: string, requirement: string): boolean {
    const keywords = requirement.toLowerCase().split(' ').filter(word => word.length > 3);
    const matches = keywords.filter(keyword => content.includes(keyword));
    return matches.length / keywords.length > 0.5; // 50% keyword coverage
  }
}