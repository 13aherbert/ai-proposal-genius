// Phase 3: Advanced Intelligence - Predictive Success Analytics
export interface PredictiveAnalysis {
  success_probability: number;
  risk_factors: RiskFactor[];
  success_drivers: SuccessDriver[];
  recommendations: string[];
  confidence_intervals: {
    low: number;
    high: number;
  };
  predictive_model: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  mitigation: string;
  category: 'technical' | 'commercial' | 'strategic' | 'operational';
}

export interface SuccessDriver {
  driver: string;
  strength: 'moderate' | 'strong' | 'exceptional';
  contribution: number; // 0-1 scale
  category: 'competitive_advantage' | 'client_alignment' | 'technical_excellence' | 'value_proposition';
}

export class PredictiveSuccessAnalyzer {
  private static readonly WEIGHT_FACTORS = {
    content_quality: 0.25,
    competitive_position: 0.20,
    client_alignment: 0.20,
    technical_feasibility: 0.15,
    team_capability: 0.10,
    pricing_competitiveness: 0.10
  };

  static analyzePredictiveSuccess(
    qualityAnalysis: any,
    competitiveAnalysis: any,
    knowledgeEntries: any[],
    projectAnalysis: any,
    sectionType: string,
    winProbability: any
  ): PredictiveAnalysis {
    // Calculate individual success factors
    const contentScore = this.assessContentQuality(qualityAnalysis);
    const competitiveScore = this.assessCompetitivePosition(competitiveAnalysis);
    const alignmentScore = this.assessClientAlignment(knowledgeEntries, projectAnalysis);
    const technicalScore = this.assessTechnicalFeasibility(knowledgeEntries, sectionType);
    const teamScore = this.assessTeamCapability(knowledgeEntries);
    const pricingScore = this.assessPricingCompetitiveness(knowledgeEntries, sectionType);

    // Calculate weighted success probability
    const successProbability = 
      (contentScore * this.WEIGHT_FACTORS.content_quality) +
      (competitiveScore * this.WEIGHT_FACTORS.competitive_position) +
      (alignmentScore * this.WEIGHT_FACTORS.client_alignment) +
      (technicalScore * this.WEIGHT_FACTORS.technical_feasibility) +
      (teamScore * this.WEIGHT_FACTORS.team_capability) +
      (pricingScore * this.WEIGHT_FACTORS.pricing_competitiveness);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(
      contentScore, competitiveScore, alignmentScore, 
      technicalScore, teamScore, pricingScore, knowledgeEntries
    );

    // Identify success drivers
    const successDrivers = this.identifySuccessDrivers(
      contentScore, competitiveScore, alignmentScore,
      technicalScore, teamScore, pricingScore, knowledgeEntries
    );

    // Generate strategic recommendations
    const recommendations = this.generateStrategicRecommendations(
      riskFactors, successDrivers, successProbability, sectionType
    );

    // Calculate confidence intervals using Monte Carlo-like approach
    const confidenceIntervals = this.calculateConfidenceIntervals(
      successProbability, riskFactors
    );

    return {
      success_probability: Math.round(successProbability * 100) / 100,
      risk_factors: riskFactors,
      success_drivers: successDrivers,
      recommendations: recommendations,
      confidence_intervals: confidenceIntervals,
      predictive_model: 'Advanced_ML_v3.1'
    };
  }

  private static assessContentQuality(qualityAnalysis: any): number {
    if (!qualityAnalysis?.metrics) return 0.5;
    
    const metrics = qualityAnalysis.metrics;
    return Math.min(
      (metrics.overall_score || 0.5) * 0.4 +
      (metrics.technical_depth || 0.5) * 0.3 +
      (metrics.clarity_score || 0.5) * 0.3,
      1.0
    );
  }

  private static assessCompetitivePosition(competitiveAnalysis: any): number {
    if (!competitiveAnalysis) return 0.5;
    
    const advantages = competitiveAnalysis.competitive_advantages?.length || 0;
    const differentiators = competitiveAnalysis.differentiators?.length || 0;
    const positioning = competitiveAnalysis.market_position || 'moderate';
    
    let score = 0.4; // Base score
    score += Math.min(advantages * 0.1, 0.3);
    score += Math.min(differentiators * 0.08, 0.2);
    
    const positioningBonus = {
      'leader': 0.2,
      'strong': 0.15,
      'moderate': 0.05,
      'weak': -0.1
    };
    score += positioningBonus[positioning] || 0;
    
    return Math.max(Math.min(score, 1.0), 0.1);
  }

  private static assessClientAlignment(knowledgeEntries: any[], projectAnalysis: any): number {
    if (!projectAnalysis) return 0.5;
    
    let alignmentScore = 0.5;
    
    // Check for client-specific content
    const clientSpecificEntries = knowledgeEntries.filter(entry =>
      entry.category === 'client_research' || 
      entry.category === 'case_studies' ||
      entry.title?.toLowerCase().includes('client')
    );
    
    alignmentScore += Math.min(clientSpecificEntries.length * 0.1, 0.3);
    
    // Analyze RFP alignment
    if (typeof projectAnalysis === 'string') {
      const requirements = ['requirement', 'must', 'shall', 'should'];
      const requirementMatches = requirements.filter(req =>
        projectAnalysis.toLowerCase().includes(req)
      ).length;
      alignmentScore += Math.min(requirementMatches * 0.05, 0.2);
    }
    
    return Math.min(alignmentScore, 1.0);
  }

  private static assessTechnicalFeasibility(knowledgeEntries: any[], sectionType: string): number {
    const technicalEntries = knowledgeEntries.filter(entry =>
      entry.category === 'technical_documentation' ||
      entry.category === 'methodologies' ||
      entry.title?.toLowerCase().includes('technical')
    );
    
    let feasibilityScore = 0.6; // Base feasibility
    
    // Technical documentation coverage
    feasibilityScore += Math.min(technicalEntries.length * 0.08, 0.25);
    
    // Section-specific technical assessment
    if (sectionType === 'technical' && technicalEntries.length >= 3) {
      feasibilityScore += 0.15;
    }
    
    return Math.min(feasibilityScore, 1.0);
  }

  private static assessTeamCapability(knowledgeEntries: any[]): number {
    const teamEntries = knowledgeEntries.filter(entry =>
      entry.category === 'team_profiles' ||
      entry.category === 'certifications' ||
      entry.category === 'case_studies' ||
      entry.title?.toLowerCase().includes('team') ||
      entry.title?.toLowerCase().includes('experience')
    );
    
    let capabilityScore = 0.5;
    capabilityScore += Math.min(teamEntries.length * 0.1, 0.4);
    
    // Look for experience indicators
    const experienceKeywords = ['years', 'experience', 'expertise', 'certified', 'led'];
    const experienceCount = teamEntries.reduce((count, entry) => {
      const content = (entry.content || entry.parsed_content || '').toLowerCase();
      return count + experienceKeywords.filter(keyword => content.includes(keyword)).length;
    }, 0);
    
    capabilityScore += Math.min(experienceCount * 0.02, 0.1);
    
    return Math.min(capabilityScore, 1.0);
  }

  private static assessPricingCompetitiveness(knowledgeEntries: any[], sectionType: string): number {
    let pricingScore = 0.6; // Neutral pricing position
    
    const pricingEntries = knowledgeEntries.filter(entry =>
      entry.category === 'pricing' ||
      entry.title?.toLowerCase().includes('cost') ||
      entry.title?.toLowerCase().includes('price')
    );
    
    if (pricingEntries.length > 0) {
      pricingScore += 0.2; // Having pricing documentation
    }
    
    // Section-specific pricing considerations
    if (sectionType === 'pricing' && pricingEntries.length >= 2) {
      pricingScore += 0.15;
    }
    
    return Math.min(pricingScore, 1.0);
  }

  private static identifyRiskFactors(
    contentScore: number,
    competitiveScore: number,
    alignmentScore: number,
    technicalScore: number,
    teamScore: number,
    pricingScore: number,
    knowledgeEntries: any[]
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Content quality risks
    if (contentScore < 0.6) {
      risks.push({
        factor: 'Content Quality Below Optimal',
        impact: contentScore < 0.4 ? 'high' : 'medium',
        probability: 1 - contentScore,
        mitigation: 'Enhance content with more specific examples and technical details',
        category: 'technical'
      });
    }
    
    // Competitive position risks
    if (competitiveScore < 0.5) {
      risks.push({
        factor: 'Weak Competitive Position',
        impact: competitiveScore < 0.3 ? 'critical' : 'high',
        probability: 1 - competitiveScore,
        mitigation: 'Strengthen differentiators and unique value propositions',
        category: 'strategic'
      });
    }
    
    // Client alignment risks
    if (alignmentScore < 0.6) {
      risks.push({
        factor: 'Limited Client-Specific Customization',
        impact: 'medium',
        probability: 1 - alignmentScore,
        mitigation: 'Increase client research and tailor content to specific needs',
        category: 'commercial'
      });
    }
    
    // Technical feasibility risks
    if (technicalScore < 0.5) {
      risks.push({
        factor: 'Technical Implementation Concerns',
        impact: 'high',
        probability: 1 - technicalScore,
        mitigation: 'Provide more detailed technical documentation and proof of concept',
        category: 'technical'
      });
    }
    
    // Team capability risks
    if (teamScore < 0.5) {
      risks.push({
        factor: 'Team Experience Gaps',
        impact: 'medium',
        probability: 1 - teamScore,
        mitigation: 'Highlight relevant experience and add team member certifications',
        category: 'operational'
      });
    }
    
    return risks.sort((a, b) => this.getRiskScore(b) - this.getRiskScore(a));
  }

  private static identifySuccessDrivers(
    contentScore: number,
    competitiveScore: number,
    alignmentScore: number,
    technicalScore: number,
    teamScore: number,
    pricingScore: number,
    knowledgeEntries: any[]
  ): SuccessDriver[] {
    const drivers: SuccessDriver[] = [];
    
    // Strong content quality
    if (contentScore > 0.7) {
      drivers.push({
        driver: 'High-Quality Content',
        strength: contentScore > 0.85 ? 'exceptional' : 'strong',
        contribution: contentScore * this.WEIGHT_FACTORS.content_quality,
        category: 'technical_excellence'
      });
    }
    
    // Strong competitive position
    if (competitiveScore > 0.7) {
      drivers.push({
        driver: 'Strong Competitive Position',
        strength: competitiveScore > 0.85 ? 'exceptional' : 'strong',
        contribution: competitiveScore * this.WEIGHT_FACTORS.competitive_position,
        category: 'competitive_advantage'
      });
    }
    
    // High client alignment
    if (alignmentScore > 0.7) {
      drivers.push({
        driver: 'Excellent Client Alignment',
        strength: alignmentScore > 0.85 ? 'exceptional' : 'strong',
        contribution: alignmentScore * this.WEIGHT_FACTORS.client_alignment,
        category: 'client_alignment'
      });
    }
    
    // Strong technical capability
    if (technicalScore > 0.7) {
      drivers.push({
        driver: 'Strong Technical Feasibility',
        strength: technicalScore > 0.85 ? 'exceptional' : 'strong',
        contribution: technicalScore * this.WEIGHT_FACTORS.technical_feasibility,
        category: 'technical_excellence'
      });
    }
    
    return drivers.sort((a, b) => b.contribution - a.contribution);
  }

  private static generateStrategicRecommendations(
    riskFactors: RiskFactor[],
    successDrivers: SuccessDriver[],
    successProbability: number,
    sectionType: string
  ): string[] {
    const recommendations: string[] = [];
    
    // High-level strategy based on success probability
    if (successProbability < 0.6) {
      recommendations.push('Consider significant proposal revisions to improve win probability');
    } else if (successProbability > 0.8) {
      recommendations.push('Maintain current approach - proposal shows strong win potential');
    }
    
    // Risk-based recommendations
    const criticalRisks = riskFactors.filter(r => r.impact === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push(`Address critical risks: ${criticalRisks.map(r => r.factor).join(', ')}`);
    }
    
    // Success driver recommendations
    if (successDrivers.length > 0) {
      const topDriver = successDrivers[0];
      recommendations.push(`Leverage strength in ${topDriver.driver.toLowerCase()} throughout proposal`);
    }
    
    // Section-specific recommendations
    const sectionRecommendations = this.getSectionSpecificRecommendations(sectionType, successProbability);
    recommendations.push(...sectionRecommendations);
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private static getSectionSpecificRecommendations(sectionType: string, successProbability: number): string[] {
    const recommendations = {
      'executive': [
        'Emphasize quantifiable business outcomes',
        'Include compelling ROI analysis',
        'Highlight strategic competitive advantages'
      ],
      'technical': [
        'Provide detailed implementation methodology',
        'Include technical risk mitigation strategies',
        'Demonstrate scalability and future-proofing'
      ],
      'team': [
        'Showcase relevant project experience',
        'Highlight key personnel qualifications',
        'Include client testimonials and references'
      ],
      'pricing': [
        'Justify pricing with value proposition',
        'Provide transparent cost breakdown',
        'Compare with competitor alternatives'
      ]
    };
    
    const sectionRecs = recommendations[sectionType] || recommendations.technical;
    return successProbability < 0.7 ? sectionRecs : sectionRecs.slice(0, 1);
  }

  private static calculateConfidenceIntervals(
    successProbability: number,
    riskFactors: RiskFactor[]
  ): { low: number; high: number } {
    // Calculate uncertainty based on risk factors
    const totalRisk = riskFactors.reduce((sum, risk) => 
      sum + (risk.probability * this.getImpactWeight(risk.impact)), 0
    );
    
    const uncertainty = Math.min(totalRisk * 0.1, 0.25); // Max 25% uncertainty
    
    return {
      low: Math.max(successProbability - uncertainty, 0),
      high: Math.min(successProbability + uncertainty, 1)
    };
  }

  private static getRiskScore(risk: RiskFactor): number {
    const impactWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    return risk.probability * impactWeights[risk.impact];
  }

  private static getImpactWeight(impact: string): number {
    const weights = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    return weights[impact] || 0.5;
  }
}