export interface CompetitiveAdvantage {
  advantage: string;
  strength: 'unique' | 'strong' | 'moderate';
  evidence: string[];
  messaging: string;
}

export interface CompetitorThreat {
  threat: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string[];
}

export interface CompetitiveAnalysis {
  advantages: CompetitiveAdvantage[];
  threats: CompetitorThreat[];
  positioning_strategy: string[];
  differentiation_score: number;
}

/**
 * Analyzes competitive positioning and identifies differentiation opportunities
 */
export class CompetitiveAnalyzer {
  
  static analyzeCompetitivePosition(
    knowledgeEntries: any[],
    rfpContent?: string,
    sectionType: string = 'general'
  ): CompetitiveAnalysis {
    
    const advantages = this.identifyCompetitiveAdvantages(knowledgeEntries, sectionType);
    const threats = this.identifyCompetitiveTrheats(rfpContent, knowledgeEntries);
    const positioningStrategy = this.generatePositioningStrategy(advantages, threats, sectionType);
    const differentiationScore = this.calculateDifferentiationScore(advantages, threats);
    
    return {
      advantages,
      threats,
      positioning_strategy: positioningStrategy,
      differentiation_score: differentiationScore
    };
  }
  
  private static identifyCompetitiveAdvantages(knowledgeEntries: any[], sectionType: string): CompetitiveAdvantage[] {
    const advantages: CompetitiveAdvantage[] = [];
    const allContent = knowledgeEntries.map(entry => 
      (entry.content || '') + ' ' + (entry.parsed_content || '')
    ).join(' ').toLowerCase();
    
    // Unique technology or methodology advantages
    const uniquePatterns = [
      { pattern: /proprietary|patented|exclusive|unique|custom-built/gi, advantage: 'Proprietary Technology', strength: 'unique' as const },
      { pattern: /certified|accredited|authorized|partnership|partner/gi, advantage: 'Strategic Certifications', strength: 'strong' as const },
      { pattern: /award|recognition|industry leader|market leader/gi, advantage: 'Industry Recognition', strength: 'strong' as const },
      { pattern: /\b(\d+)\+?\s*years?\s+experience/gi, advantage: 'Extensive Experience', strength: 'moderate' as const },
      { pattern: /24\/7|round.the.clock|continuous|always available/gi, advantage: '24/7 Support', strength: 'moderate' as const }
    ];
    
    for (const { pattern, advantage, strength } of uniquePatterns) {
      const matches = allContent.match(pattern);
      if (matches && matches.length > 0) {
        const evidence = this.extractEvidence(knowledgeEntries, pattern);
        const messaging = this.generateAdvantageMessaging(advantage, evidence, sectionType);
        
        advantages.push({
          advantage,
          strength,
          evidence,
          messaging
        });
      }
    }
    
    // Quantitative advantages (performance metrics, scale, etc.)
    const quantitativeAdvantages = this.identifyQuantitativeAdvantages(knowledgeEntries, sectionType);
    advantages.push(...quantitativeAdvantages);
    
    return advantages;
  }
  
  private static identifyQuantitativeAdvantages(knowledgeEntries: any[], sectionType: string): CompetitiveAdvantage[] {
    const advantages: CompetitiveAdvantage[] = [];
    const allContent = knowledgeEntries.map(entry => 
      (entry.content || '') + ' ' + (entry.parsed_content || '')
    ).join(' ');
    
    // Performance metrics
    const performancePatterns = [
      { pattern: /(\d+)%\s*(?:faster|quicker|speed|improvement)/gi, advantage: 'Performance Improvement' },
      { pattern: /(\d+)%\s*(?:cost\s*)?(?:saving|reduction|decrease)/gi, advantage: 'Cost Efficiency' },
      { pattern: /(\d+)%\s*(?:increase|improvement|boost|enhancement)/gi, advantage: 'Result Enhancement' },
      { pattern: /(?:within|in)\s*(\d+)\s*(?:days?|weeks?|hours?)/gi, advantage: 'Fast Delivery' }
    ];
    
    for (const { pattern, advantage } of performancePatterns) {
      const matches = allContent.match(pattern);
      if (matches && matches.length > 0) {
        const evidence = matches.slice(0, 3); // Top 3 metrics
        const messaging = this.generateQuantitativeMessaging(advantage, evidence, sectionType);
        
        advantages.push({
          advantage,
          strength: 'strong' as const,
          evidence,
          messaging
        });
      }
    }
    
    return advantages;
  }
  
  private static identifyCompetitiveTrheats(rfpContent?: string, knowledgeEntries?: any[]): CompetitorThreat[] {
    const threats: CompetitorThreat[] = [];
    
    if (!rfpContent) return threats;
    
    const rfpLower = rfpContent.toLowerCase();
    
    // Common competitive threat patterns in RFPs
    const threatPatterns = [
      {
        pattern: /incumbent|current\s+provider|existing\s+vendor/gi,
        threat: 'Incumbent Advantage',
        severity: 'high' as const,
        mitigation: [
          'Emphasize fresh perspective and innovation',
          'Highlight limitations of status quo',
          'Show concrete improvements over current state'
        ]
      },
      {
        pattern: /lowest\s+(?:cost|price)|budget\s+constraints|cost\s+sensitive/gi,
        threat: 'Price Competition',
        severity: 'medium' as const,
        mitigation: [
          'Focus on total cost of ownership',
          'Demonstrate ROI and value',
          'Show cost of poor quality or delays'
        ]
      },
      {
        pattern: /large\s+(?:firm|company|organization)|enterprise\s+scale/gi,
        threat: 'Size Disadvantage',
        severity: 'medium' as const,
        mitigation: [
          'Emphasize agility and personal attention',
          'Highlight specialized expertise',
          'Show partner and alliance capabilities'
        ]
      },
      {
        pattern: /proven\s+track\s+record|extensive\s+experience|established/gi,
        threat: 'Experience Requirements',
        severity: 'high' as const,
        mitigation: [
          'Highlight relevant project successes',
          'Emphasize team qualifications',
          'Show similar project outcomes'
        ]
      }
    ];
    
    for (const { pattern, threat, severity, mitigation } of threatPatterns) {
      if (pattern.test(rfpLower)) {
        threats.push({ threat, severity, mitigation });
      }
    }
    
    return threats;
  }
  
  private static generatePositioningStrategy(
    advantages: CompetitiveAdvantage[], 
    threats: CompetitorThreat[], 
    sectionType: string
  ): string[] {
    const strategy: string[] = [];
    
    // Lead with strongest advantages
    const uniqueAdvantages = advantages.filter(adv => adv.strength === 'unique');
    const strongAdvantages = advantages.filter(adv => adv.strength === 'strong');
    
    if (uniqueAdvantages.length > 0) {
      strategy.push(`Lead with unique capabilities: ${uniqueAdvantages.map(adv => adv.advantage).join(', ')}`);
    }
    
    if (strongAdvantages.length > 0) {
      strategy.push(`Emphasize key strengths: ${strongAdvantages.map(adv => adv.advantage).join(', ')}`);
    }
    
    // Address major threats
    const highThreats = threats.filter(threat => threat.severity === 'high');
    if (highThreats.length > 0) {
      strategy.push('Proactively address potential concerns about experience and track record');
    }
    
    // Section-specific positioning
    switch (sectionType) {
      case 'executive':
        strategy.push('Position as the strategic choice for long-term success');
        strategy.push('Emphasize risk mitigation and guaranteed outcomes');
        break;
      case 'technical':
        strategy.push('Demonstrate technical leadership and innovation');
        strategy.push('Show methodology advantages and proven results');
        break;
      case 'team':
        strategy.push('Highlight team expertise and project success stories');
        break;
      case 'pricing':
        strategy.push('Position price as investment in superior outcomes');
        strategy.push('Demonstrate clear ROI and cost justification');
        break;
    }
    
    return strategy;
  }
  
  private static extractEvidence(knowledgeEntries: any[], pattern: RegExp): string[] {
    const evidence: string[] = [];
    
    for (const entry of knowledgeEntries) {
      const content = (entry.content || '') + ' ' + (entry.parsed_content || '');
      const matches = content.match(pattern);
      
      if (matches) {
        // Extract sentences containing the matches
        const sentences = content.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (pattern.test(sentence) && sentence.trim().length > 20) {
            evidence.push(sentence.trim());
            if (evidence.length >= 3) break;
          }
        }
      }
      
      if (evidence.length >= 3) break;
    }
    
    return evidence;
  }
  
  private static generateAdvantageMessaging(advantage: string, evidence: string[], sectionType: string): string {
    const messagingTemplates: Record<string, string> = {
      'Proprietary Technology': 'Our proprietary approach delivers unique value that competitors cannot replicate',
      'Strategic Certifications': 'Certified partnerships ensure proven methodologies and industry-leading results',
      'Industry Recognition': 'Award-winning expertise provides confidence in exceptional outcomes',
      'Extensive Experience': 'Decades of experience translate to reduced risk and accelerated success',
      '24/7 Support': 'Round-the-clock availability ensures continuous project momentum'
    };
    
    return messagingTemplates[advantage] || `Our ${advantage.toLowerCase()} provides distinct competitive value`;
  }
  
  private static generateQuantitativeMessaging(advantage: string, evidence: string[], sectionType: string): string {
    const messagingTemplates: Record<string, string> = {
      'Performance Improvement': 'Proven performance enhancements deliver measurable competitive advantages',
      'Cost Efficiency': 'Demonstrated cost savings provide superior ROI compared to alternatives',
      'Result Enhancement': 'Quantified improvements ensure your investment delivers maximum value',
      'Fast Delivery': 'Accelerated timelines give you competitive advantage in your market'
    };
    
    return messagingTemplates[advantage] || 'Quantified results demonstrate superior value delivery';
  }
  
  private static calculateDifferentiationScore(advantages: CompetitiveAdvantage[], threats: CompetitorThreat[]): number {
    let score = 50; // Base score
    
    // Add points for advantages
    for (const advantage of advantages) {
      switch (advantage.strength) {
        case 'unique': score += 20; break;
        case 'strong': score += 10; break;
        case 'moderate': score += 5; break;
      }
    }
    
    // Subtract points for unaddressed threats
    for (const threat of threats) {
      switch (threat.severity) {
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
}