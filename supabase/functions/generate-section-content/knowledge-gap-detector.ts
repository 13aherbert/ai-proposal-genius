import { KnowledgeEntry } from './types.ts';

export interface KnowledgeGap {
  category: string;
  missing_content: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  recommendations: string[];
}

export interface KnowledgeGapAnalysis {
  gaps: KnowledgeGap[];
  coverage_score: number;
  critical_gaps: KnowledgeGap[];
  recommendations: string[];
}

/**
 * Enhanced knowledge gap detection for proposal optimization
 */
export class KnowledgeGapDetector {
  
  static analyzeKnowledgeGaps(
    knowledgeEntries: KnowledgeEntry[], 
    sectionType: string,
    rfpRequirements?: string
  ): KnowledgeGapAnalysis {
    
    const requiredTopics = this.getRequiredTopicsForSection(sectionType);
    const gaps: KnowledgeGap[] = [];
    let totalCoverage = 0;
    
    // Analyze coverage for each required topic
    for (const topic of requiredTopics) {
      const coverage = this.assessTopicCoverage(knowledgeEntries, topic);
      totalCoverage += coverage.score;
      
      if (coverage.score < 0.7) { // Less than 70% coverage
        gaps.push({
          category: topic.category,
          missing_content: topic.content,
          priority: coverage.score < 0.3 ? 'critical' : coverage.score < 0.5 ? 'high' : 'medium',
          impact: topic.impact,
          recommendations: this.generateRecommendations(topic, coverage)
        });
      }
    }
    
    const coverageScore = Math.round((totalCoverage / requiredTopics.length) * 100);
    const criticalGaps = gaps.filter(gap => gap.priority === 'critical');
    
    // Generate RFP-specific gaps if requirements are provided
    if (rfpRequirements) {
      const rfpGaps = this.analyzeRfpSpecificGaps(knowledgeEntries, rfpRequirements, sectionType);
      gaps.push(...rfpGaps);
    }
    
    return {
      gaps,
      coverage_score: coverageScore,
      critical_gaps: criticalGaps,
      recommendations: this.generateOverallRecommendations(gaps, coverageScore)
    };
  }
  
  private static getRequiredTopicsForSection(sectionType: string): RequiredTopic[] {
    const commonTopics: RequiredTopic[] = [
      {
        category: 'company_overview',
        content: 'Company background, history, and core competencies',
        keywords: ['company', 'organization', 'established', 'founded', 'experience'],
        impact: 'Establishes credibility and trust',
        weight: 0.8
      },
      {
        category: 'relevant_experience',
        content: 'Similar project experience and case studies',
        keywords: ['project', 'case study', 'similar', 'experience', 'delivered'],
        impact: 'Demonstrates proven capability',
        weight: 0.9
      }
    ];
    
    switch (sectionType) {
      case 'executive':
        return [
          ...commonTopics,
          {
            category: 'value_proposition',
            content: 'Unique value and competitive advantages',
            keywords: ['value', 'advantage', 'unique', 'differentiator', 'benefit'],
            impact: 'Differentiates from competitors',
            weight: 1.0
          },
          {
            category: 'roi_metrics',
            content: 'ROI, cost savings, or performance metrics',
            keywords: ['ROI', 'savings', 'reduction', 'improvement', 'efficiency', '%'],
            impact: 'Quantifies business value',
            weight: 0.9
          }
        ];
        
      case 'technical':
        return [
          ...commonTopics,
          {
            category: 'methodology',
            content: 'Technical approach and methodology',
            keywords: ['methodology', 'approach', 'framework', 'process', 'implementation'],
            impact: 'Shows technical competency',
            weight: 1.0
          },
          {
            category: 'tools_technologies',
            content: 'Specific tools, technologies, and platforms',
            keywords: ['technology', 'platform', 'tool', 'software', 'system'],
            impact: 'Demonstrates technical depth',
            weight: 0.8
          },
          {
            category: 'quality_assurance',
            content: 'Quality control and testing procedures',
            keywords: ['quality', 'testing', 'assurance', 'validation', 'review'],
            impact: 'Reduces project risk',
            weight: 0.7
          }
        ];
        
      case 'team':
        return [
          {
            category: 'team_qualifications',
            content: 'Team member qualifications and certifications',
            keywords: ['certified', 'qualification', 'degree', 'experience', 'expertise'],
            impact: 'Establishes team credibility',
            weight: 1.0
          },
          {
            category: 'project_roles',
            content: 'Specific roles and responsibilities',
            keywords: ['role', 'responsibility', 'lead', 'manager', 'specialist'],
            impact: 'Shows project organization',
            weight: 0.8
          },
          {
            category: 'team_results',
            content: 'Past project results and achievements',
            keywords: ['achieved', 'delivered', 'successful', 'completed', 'results'],
            impact: 'Proves team effectiveness',
            weight: 0.9
          }
        ];
        
      case 'pricing':
        return [
          {
            category: 'cost_breakdown',
            content: 'Detailed cost structure and pricing model',
            keywords: ['cost', 'price', 'fee', 'rate', 'budget', 'investment'],
            impact: 'Provides pricing transparency',
            weight: 1.0
          },
          {
            category: 'payment_terms',
            content: 'Payment schedules and terms',
            keywords: ['payment', 'terms', 'schedule', 'milestone', 'invoicing'],
            impact: 'Clarifies financial arrangements',
            weight: 0.7
          },
          {
            category: 'value_justification',
            content: 'Cost justification and value demonstration',
            keywords: ['value', 'justification', 'investment', 'return', 'savings'],
            impact: 'Justifies pricing decisions',
            weight: 0.9
          }
        ];
        
      default:
        return commonTopics;
    }
  }
  
  private static assessTopicCoverage(knowledgeEntries: KnowledgeEntry[], topic: RequiredTopic): TopicCoverage {
    let score = 0;
    let foundEntries: KnowledgeEntry[] = [];
    
    for (const entry of knowledgeEntries) {
      const content = (entry.content || '') + ' ' + (entry.parsed_content || '');
      const matchCount = topic.keywords.reduce((count, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        return count + (content.match(regex) || []).length;
      }, 0);
      
      if (matchCount > 0) {
        foundEntries.push(entry);
        // Score based on keyword matches and content depth
        const entryScore = Math.min(1.0, (matchCount / topic.keywords.length) * (content.length / 1000));
        score = Math.max(score, entryScore);
      }
    }
    
    return {
      topic: topic.category,
      score: Math.min(1.0, score),
      found_entries: foundEntries,
      missing_keywords: topic.keywords.filter(keyword => {
        return !foundEntries.some(entry => {
          const content = (entry.content || '') + ' ' + (entry.parsed_content || '');
          return new RegExp(`\\b${keyword}\\b`, 'gi').test(content);
        });
      })
    };
  }
  
  private static analyzeRfpSpecificGaps(
    knowledgeEntries: KnowledgeEntry[], 
    rfpRequirements: string, 
    sectionType: string
  ): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    
    // Extract key requirements from RFP text
    const requirementPatterns = [
      /must\s+(?:have|provide|include|demonstrate|show)\s+([^.]{10,50})/gi,
      /required?\s+(?:to|:|is|are)\s+([^.]{10,50})/gi,
      /shall\s+(?:provide|include|demonstrate|have)\s+([^.]{10,50})/gi
    ];
    
    const extractedRequirements: string[] = [];
    
    for (const pattern of requirementPatterns) {
      let match;
      while ((match = pattern.exec(rfpRequirements)) !== null) {
        extractedRequirements.push(match[1].trim());
      }
    }
    
    // Check if knowledge base covers these requirements
    for (const requirement of extractedRequirements) {
      const coverage = this.checkRequirementCoverage(knowledgeEntries, requirement);
      
      if (coverage < 0.5) {
        gaps.push({
          category: 'rfp_specific',
          missing_content: requirement,
          priority: coverage < 0.2 ? 'critical' : 'high',
          impact: 'May not meet RFP requirements',
          recommendations: [
            `Add specific information about: ${requirement}`,
            'Consider creating a dedicated knowledge entry for this requirement',
            'Provide concrete examples or case studies demonstrating this capability'
          ]
        });
      }
    }
    
    return gaps;
  }
  
  private static checkRequirementCoverage(knowledgeEntries: KnowledgeEntry[], requirement: string): number {
    const keywords = requirement.toLowerCase().split(' ').filter(word => word.length > 3);
    let maxCoverage = 0;
    
    for (const entry of knowledgeEntries) {
      const content = ((entry.content || '') + ' ' + (entry.parsed_content || '')).toLowerCase();
      const matches = keywords.filter(keyword => content.includes(keyword));
      const coverage = matches.length / keywords.length;
      maxCoverage = Math.max(maxCoverage, coverage);
    }
    
    return maxCoverage;
  }
  
  private static generateRecommendations(topic: RequiredTopic, coverage: TopicCoverage): string[] {
    const recommendations: string[] = [];
    
    if (coverage.score < 0.3) {
      recommendations.push(`Create a comprehensive knowledge entry covering ${topic.content}`);
      recommendations.push(`Focus on ${topic.impact.toLowerCase()}`);
    } else if (coverage.score < 0.7) {
      recommendations.push(`Expand existing content to better cover ${topic.content}`);
      recommendations.push(`Add more details about ${coverage.missing_keywords.join(', ')}`);
    }
    
    if (coverage.missing_keywords.length > 0) {
      recommendations.push(`Include information about: ${coverage.missing_keywords.join(', ')}`);
    }
    
    return recommendations;
  }
  
  private static generateOverallRecommendations(gaps: KnowledgeGap[], coverageScore: number): string[] {
    const recommendations: string[] = [];
    
    if (coverageScore < 60) {
      recommendations.push('Knowledge base needs significant expansion before generating high-quality proposals');
    } else if (coverageScore < 80) {
      recommendations.push('Consider adding more detailed content in key areas to improve proposal quality');
    }
    
    const criticalGaps = gaps.filter(gap => gap.priority === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push(`Address ${criticalGaps.length} critical knowledge gaps immediately`);
    }
    
    const commonCategories = gaps.reduce((acc, gap) => {
      acc[gap.category] = (acc[gap.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(commonCategories).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > 1) {
      recommendations.push(`Focus on improving ${topCategory[0].replace('_', ' ')} content`);
    }
    
    return recommendations;
  }
}

interface RequiredTopic {
  category: string;
  content: string;
  keywords: string[];
  impact: string;
  weight: number;
}

interface TopicCoverage {
  topic: string;
  score: number;
  found_entries: KnowledgeEntry[];
  missing_keywords: string[];
}