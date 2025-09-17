// Phase 3: Advanced Intelligence - Semantic Content Enhancement
export interface SemanticEnhancement {
  enhanced_content: string;
  improvements: ContentImprovement[];
  semantic_score: number;
  readability_score: number;
  technical_depth_score: number;
  enhancement_techniques: string[];
}

export interface ContentImprovement {
  type: 'clarity' | 'specificity' | 'technical_depth' | 'flow' | 'impact';
  description: string;
  before: string;
  after: string;
  confidence: number;
}

export class SemanticContentEnhancer {
  private static readonly ENHANCEMENT_PATTERNS = {
    clarity: [
      { pattern: /\b(various|multiple|several|numerous)\b/gi, replacement: 'specific', weight: 0.3 },
      { pattern: /\b(things|stuff|items)\b/gi, replacement: 'elements', weight: 0.2 },
      { pattern: /\b(very|really|quite)\s+(\w+)/gi, replacement: '$2', weight: 0.1 }
    ],
    specificity: [
      { pattern: /\b(we will|we can|we are able to)\b/gi, replacement: 'our team will', weight: 0.4 },
      { pattern: /\b(industry standard|best practices)\b/gi, replacement: 'proven methodologies', weight: 0.3 },
      { pattern: /\b(significant|substantial)\b/gi, replacement: 'measurable', weight: 0.2 }
    ],
    impact: [
      { pattern: /\b(help|assist)\b/gi, replacement: 'enable', weight: 0.3 },
      { pattern: /\b(improve|enhance)\b/gi, replacement: 'optimize', weight: 0.2 },
      { pattern: /\b(good|nice|fine)\b/gi, replacement: 'effective', weight: 0.2 }
    ]
  };

  static enhanceContent(
    content: string,
    sectionType: string,
    knowledgeEntries: any[],
    projectAnalysis: any
  ): SemanticEnhancement {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Apply semantic enhancements
    const clarityEnhancements = this.enhanceClarity(enhancedContent);
    enhancedContent = clarityEnhancements.content;
    improvements.push(...clarityEnhancements.improvements);
    
    const specificityEnhancements = this.enhanceSpecificity(enhancedContent, knowledgeEntries);
    enhancedContent = specificityEnhancements.content;
    improvements.push(...specificityEnhancements.improvements);
    
    const technicalEnhancements = this.enhanceTechnicalDepth(enhancedContent, sectionType, knowledgeEntries);
    enhancedContent = technicalEnhancements.content;
    improvements.push(...technicalEnhancements.improvements);
    
    const flowEnhancements = this.enhanceFlow(enhancedContent);
    enhancedContent = flowEnhancements.content;
    improvements.push(...flowEnhancements.improvements);
    
    const impactEnhancements = this.enhanceImpact(enhancedContent, projectAnalysis);
    enhancedContent = impactEnhancements.content;
    improvements.push(...impactEnhancements.improvements);
    
    // Calculate scores
    const semanticScore = this.calculateSemanticScore(content, enhancedContent);
    const readabilityScore = this.calculateReadabilityScore(enhancedContent);
    const technicalDepthScore = this.calculateTechnicalDepthScore(enhancedContent, sectionType);
    
    return {
      enhanced_content: enhancedContent,
      improvements: improvements.filter(imp => imp.confidence > 0.6),
      semantic_score: semanticScore,
      readability_score: readabilityScore,
      technical_depth_score: technicalDepthScore,
      enhancement_techniques: [
        'clarity_optimization',
        'specificity_enhancement',
        'technical_depth_improvement',
        'flow_optimization',
        'impact_amplification'
      ]
    };
  }

  private static enhanceClarity(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Remove filler words and improve precision
    const fillerPatterns = [
      { pattern: /\b(actually|basically|essentially|literally)\s+/gi, replacement: '' },
      { pattern: /\b(kind of|sort of)\s+/gi, replacement: '' },
      { pattern: /\s+,/g, replacement: ',' },
      { pattern: /\s{2,}/g, replacement: ' ' }
    ];
    
    fillerPatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        enhancedContent = enhancedContent.replace(pattern, replacement);
        improvements.push({
          type: 'clarity',
          description: 'Removed filler words for clearer communication',
          before: matches[0],
          after: replacement,
          confidence: 0.8
        });
      }
    });
    
    // Improve sentence structure
    enhancedContent = this.improveSentenceStructure(enhancedContent, improvements);
    
    return { content: enhancedContent, improvements };
  }

  private static enhanceSpecificity(
    content: string,
    knowledgeEntries: any[]
  ): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Replace generic terms with specific ones from knowledge base
    const specificTerms = this.extractSpecificTerms(knowledgeEntries);
    
    // Generic to specific replacements
    const genericPatterns = [
      { pattern: /\btechnology\b/gi, replacements: specificTerms.technologies },
      { pattern: /\bmethodology\b/gi, replacements: specificTerms.methodologies },
      { pattern: /\bapproach\b/gi, replacements: specificTerms.approaches },
      { pattern: /\btool\b/gi, replacements: specificTerms.tools }
    ];
    
    genericPatterns.forEach(({ pattern, replacements }) => {
      if (replacements.length > 0) {
        const matches = enhancedContent.match(pattern);
        if (matches) {
          const replacement = replacements[0]; // Use the most relevant one
          enhancedContent = enhancedContent.replace(pattern, replacement);
          improvements.push({
            type: 'specificity',
            description: 'Replaced generic term with specific technology/methodology',
            before: matches[0],
            after: replacement,
            confidence: 0.7
          });
        }
      }
    });
    
    return { content: enhancedContent, improvements };
  }

  private static enhanceTechnicalDepth(
    content: string,
    sectionType: string,
    knowledgeEntries: any[]
  ): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    if (sectionType === 'technical') {
      // Add technical details where appropriate
      const technicalEnhancements = this.addTechnicalDetails(enhancedContent, knowledgeEntries);
      enhancedContent = technicalEnhancements.content;
      improvements.push(...technicalEnhancements.improvements);
    }
    
    // Enhance technical terminology
    const terminologyEnhancements = this.enhanceTechnicalTerminology(enhancedContent);
    enhancedContent = terminologyEnhancements.content;
    improvements.push(...terminologyEnhancements.improvements);
    
    return { content: enhancedContent, improvements };
  }

  private static enhanceFlow(content: string): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Add transition words for better flow
    const paragraphs = enhancedContent.split('\n\n');
    const enhancedParagraphs = paragraphs.map((paragraph, index) => {
      if (index === 0) return paragraph;
      
      // Add appropriate transition based on content
      const transitions = this.selectTransition(paragraphs[index - 1], paragraph);
      if (transitions.length > 0) {
        const transition = transitions[0];
        improvements.push({
          type: 'flow',
          description: 'Added transition for better paragraph flow',
          before: paragraph.substring(0, 20) + '...',
          after: `${transition} ${paragraph.substring(0, 20)}...`,
          confidence: 0.6
        });
        return `${transition} ${paragraph}`;
      }
      
      return paragraph;
    });
    
    enhancedContent = enhancedParagraphs.join('\n\n');
    
    return { content: enhancedContent, improvements };
  }

  private static enhanceImpact(
    content: string,
    projectAnalysis: any
  ): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Strengthen action words
    const actionEnhancements = [
      { pattern: /\bwill help\b/gi, replacement: 'will enable', confidence: 0.7 },
      { pattern: /\bcan provide\b/gi, replacement: 'delivers', confidence: 0.8 },
      { pattern: /\bwill support\b/gi, replacement: 'will drive', confidence: 0.6 },
      { pattern: /\bwill improve\b/gi, replacement: 'will optimize', confidence: 0.7 }
    ];
    
    actionEnhancements.forEach(({ pattern, replacement, confidence }) => {
      const matches = content.match(pattern);
      if (matches) {
        enhancedContent = enhancedContent.replace(pattern, replacement);
        improvements.push({
          type: 'impact',
          description: 'Strengthened action words for greater impact',
          before: matches[0],
          after: replacement,
          confidence
        });
      }
    });
    
    return { content: enhancedContent, improvements };
  }

  private static extractSpecificTerms(knowledgeEntries: any[]): {
    technologies: string[];
    methodologies: string[];
    approaches: string[];
    tools: string[];
  } {
    const terms = {
      technologies: [] as string[],
      methodologies: [] as string[],
      approaches: [] as string[],
      tools: [] as string[]
    };
    
    knowledgeEntries.forEach(entry => {
      const content = (entry.content || entry.parsed_content || '').toLowerCase();
      
      // Extract technology names (look for capitalized tech terms)
      const techMatches = content.match(/\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\b/g) || [];
      terms.technologies.push(...techMatches.slice(0, 3));
      
      // Extract methodologies
      if (content.includes('methodology') || content.includes('approach')) {
        const methodologyMatches = content.match(/\w+\s+methodology/gi) || [];
        terms.methodologies.push(...methodologyMatches.slice(0, 2));
      }
      
      // Extract tools
      if (content.includes('tool') || content.includes('software')) {
        const toolMatches = content.match(/\b\w+\s+(?:tool|software)\b/gi) || [];
        terms.tools.push(...toolMatches.slice(0, 2));
      }
    });
    
    // Remove duplicates and return most relevant
    Object.keys(terms).forEach(key => {
      terms[key] = [...new Set(terms[key])].slice(0, 5);
    });
    
    return terms;
  }

  private static improveSentenceStructure(
    content: string,
    improvements: ContentImprovement[]
  ): string {
    // Split long sentences
    const sentences = content.split(/(?<=[.!?])\s+/);
    const improvedSentences = sentences.map(sentence => {
      const words = sentence.split(/\s+/);
      if (words.length > 25) {
        // Try to split at natural break points
        const breakPoints = [' and ', ' but ', ' however ', ' therefore '];
        for (const breakPoint of breakPoints) {
          if (sentence.includes(breakPoint)) {
            const parts = sentence.split(breakPoint);
            if (parts.length === 2) {
              improvements.push({
                type: 'clarity',
                description: 'Split long sentence for better readability',
                before: sentence.substring(0, 30) + '...',
                after: `${parts[0].trim()}. ${breakPoint.trim()} ${parts[1].trim()}`,
                confidence: 0.6
              });
              return `${parts[0].trim()}. ${breakPoint.trim().charAt(0).toUpperCase() + breakPoint.trim().slice(1)} ${parts[1].trim()}`;
            }
          }
        }
      }
      return sentence;
    });
    
    return improvedSentences.join(' ');
  }

  private static addTechnicalDetails(
    content: string,
    knowledgeEntries: any[]
  ): { content: string; improvements: ContentImprovement[] } {
    let enhancedContent = content;
    const improvements: ContentImprovement[] = [];
    
    // Find places where technical details could be added
    const technicalEntries = knowledgeEntries.filter(entry =>
      entry.category === 'technical_documentation' ||
      entry.category === 'methodologies'
    );
    
    if (technicalEntries.length > 0) {
      // Look for opportunities to add specific technical information
      const genericTechReferences = content.match(/\b(system|solution|platform|framework)\b/gi) || [];
      
      if (genericTechReferences.length > 0 && technicalEntries.length > 0) {
        const specificDetail = this.extractRelevantTechnicalDetail(technicalEntries[0]);
        if (specificDetail) {
          // Add a technical detail after the first generic reference
          const firstRef = genericTechReferences[0];
          const refIndex = content.indexOf(firstRef);
          const sentenceEnd = content.indexOf('.', refIndex);
          
          if (sentenceEnd > refIndex) {
            const before = content.substring(refIndex, sentenceEnd + 1);
            const after = `${before} ${specificDetail}`;
            enhancedContent = content.replace(before, after);
            
            improvements.push({
              type: 'technical_depth',
              description: 'Added specific technical detail',
              before: before,
              after: after,
              confidence: 0.7
            });
          }
        }
      }
    }
    
    return { content: enhancedContent, improvements };
  }

  private static enhanceTechnicalTerminology(content: string): { content: string; improvements: ContentImprovement[] } {
    const improvements: ContentImprovement[] = [];
    let enhancedContent = content;
    
    const terminologyUpgrades = [
      { pattern: /\bdata storage\b/gi, replacement: 'data repository', confidence: 0.6 },
      { pattern: /\buser interface\b/gi, replacement: 'user experience interface', confidence: 0.7 },
      { pattern: /\bsystem integration\b/gi, replacement: 'seamless system integration', confidence: 0.8 }
    ];
    
    terminologyUpgrades.forEach(({ pattern, replacement, confidence }) => {
      const matches = content.match(pattern);
      if (matches) {
        enhancedContent = enhancedContent.replace(pattern, replacement);
        improvements.push({
          type: 'technical_depth',
          description: 'Enhanced technical terminology',
          before: matches[0],
          after: replacement,
          confidence
        });
      }
    });
    
    return { content: enhancedContent, improvements };
  }

  private static selectTransition(prevParagraph: string, currentParagraph: string): string[] {
    const transitions = [];
    
    // Analyze paragraph content to suggest appropriate transitions
    if (currentParagraph.toLowerCase().includes('furthermore') || 
        currentParagraph.toLowerCase().includes('addition')) {
      transitions.push('Additionally,');
    } else if (currentParagraph.toLowerCase().includes('however') ||
               currentParagraph.toLowerCase().includes('contrast')) {
      transitions.push('However,');
    } else if (currentParagraph.toLowerCase().includes('result') ||
               currentParagraph.toLowerCase().includes('therefore')) {
      transitions.push('Consequently,');
    } else {
      transitions.push('Furthermore,');
    }
    
    return transitions;
  }

  private static extractRelevantTechnicalDetail(entry: any): string | null {
    const content = entry.content || entry.parsed_content || '';
    
    // Look for specific technical implementations or specifications
    const technicalPatterns = [
      /using\s+[\w\s]+\s+architecture/i,
      /implemented\s+with\s+[\w\s]+/i,
      /leveraging\s+[\w\s]+\s+technology/i
    ];
    
    for (const pattern of technicalPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0] + '.';
      }
    }
    
    return null;
  }

  private static calculateSemanticScore(originalContent: string, enhancedContent: string): number {
    const improvementRatio = (enhancedContent.length - originalContent.length) / originalContent.length;
    const baseScore = 0.7;
    const improvementBonus = Math.min(Math.max(improvementRatio, 0) * 0.2, 0.3);
    
    return Math.min(baseScore + improvementBonus, 1.0);
  }

  private static calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Optimal range: 15-20 words per sentence
    let readabilityScore = 0.8;
    if (avgWordsPerSentence > 25) {
      readabilityScore -= 0.2;
    } else if (avgWordsPerSentence < 10) {
      readabilityScore -= 0.1;
    }
    
    return Math.max(Math.min(readabilityScore, 1.0), 0.1);
  }

  private static calculateTechnicalDepthScore(content: string, sectionType: string): number {
    const technicalKeywords = [
      'methodology', 'framework', 'architecture', 'implementation', 
      'integration', 'scalability', 'performance', 'security'
    ];
    
    const keywordCount = technicalKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    ).length;
    
    let baseScore = 0.6;
    baseScore += Math.min(keywordCount * 0.05, 0.3);
    
    // Section-specific adjustments
    if (sectionType === 'technical' && keywordCount >= 4) {
      baseScore += 0.1;
    }
    
    return Math.min(baseScore, 1.0);
  }
}