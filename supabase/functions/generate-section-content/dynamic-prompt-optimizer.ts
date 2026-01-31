// Phase 3: Advanced Intelligence - Dynamic Prompt Optimization
export interface PromptOptimization {
  optimized_prompt: string;
  optimization_strategy: string;
  confidence_boost: number;
  applied_techniques: string[];
  context_enhancements: string[];
}

export interface PromptPerformanceMetrics {
  section_type: string;
  prompt_hash: string;
  avg_quality_score: number;
  avg_confidence: number;
  usage_count: number;
  success_rate: number;
}

export class DynamicPromptOptimizer {
  private static readonly OPTIMIZATION_TECHNIQUES: {
    [key: string]: {
      keywords: string[];
      structure: string;
      tone: string;
      avoid: string[];
      maxWords: number;
    };
  } = {
    'executive': {
      keywords: ['strategic', 'value proposition', 'business impact', 'ROI', 'competitive advantage'],
      structure: 'Problem → Solution → Evidence → Outcome. Lead with client problem, not capabilities.',
      tone: 'confident, factual, concise',
      avoid: ['world-class', 'unparalleled', 'cutting-edge', 'extensive experience', 'industry-leading'],
      maxWords: 400
    },
    'technical': {
      keywords: ['methodology', 'architecture', 'best practices', 'implementation', 'scalability'],
      structure: 'Technical approach, specific methodology names, implementation plan, evidence from past projects',
      tone: 'technical, detailed, systematic',
      avoid: ['best-in-class', 'state-of-the-art', 'proven methodology', 'innovative solutions'],
      maxWords: 600
    },
    'team': {
      keywords: ['expertise', 'experience', 'qualifications', 'track record', 'leadership'],
      structure: 'Specific credentials, named projects with outcomes, relevant certifications',
      tone: 'professional, credible, specific',
      avoid: ['highly qualified', 'extensive experience', 'talented team', 'industry experts'],
      maxWords: 400
    },
    'timeline': {
      keywords: ['milestones', 'deliverables', 'schedule', 'critical path', 'risk mitigation'],
      structure: 'Specific dates, phase breakdown, dependencies, buffer time',
      tone: 'structured, realistic, organized',
      avoid: ['aggressive timeline', 'efficient delivery', 'streamlined process'],
      maxWords: 350
    },
    'pricing': {
      keywords: ['value', 'cost-effective', 'investment', 'budget', 'pricing model'],
      structure: 'Total value → detailed breakdown → line items that sum correctly → payment terms',
      tone: 'transparent, value-focused, confident',
      avoid: ['competitive pricing', 'cost-effective solution', 'best value', 'affordable'],
      maxWords: 500
    }
  };

  static optimizePrompt(
    basePrompt: string,
    sectionType: string,
    sectionTitle: string,
    project: any,
    knowledgeContent: string,
    existingSections: any[]
  ): PromptOptimization {
    const optimization = this.OPTIMIZATION_TECHNIQUES[sectionType] || this.OPTIMIZATION_TECHNIQUES.technical;
    
    // Apply section-specific optimizations
    let optimizedPrompt = this.enhancePromptStructure(basePrompt, optimization);
    
    // Add anti-repetition measures
    const antiRepetitionEnhancements = this.addAntiRepetitionMeasures(
      optimizedPrompt, existingSections, sectionTitle
    );
    optimizedPrompt = antiRepetitionEnhancements.prompt;
    
    // Add context-aware enhancements
    const contextEnhancements = this.addContextualEnhancements(
      optimizedPrompt, sectionType, project, existingSections
    );
    optimizedPrompt = contextEnhancements.prompt;
    
    // Apply RFP-focused enhancements
    const rfpFocusedEnhancements = this.addRFPFocusedGuidance(
      optimizedPrompt, sectionType, project.analysis
    );
    optimizedPrompt = rfpFocusedEnhancements.prompt;
    
    // Apply advanced prompt engineering techniques
    const advancedEnhancements = this.applyAdvancedTechniques(optimizedPrompt, sectionType);
    optimizedPrompt = advancedEnhancements.prompt;
    
    // Calculate expected confidence boost
    const confidenceBoost = this.calculateConfidenceBoost(
      basePrompt, optimizedPrompt, sectionType
    );

    return {
      optimized_prompt: optimizedPrompt,
      optimization_strategy: `${sectionType}_optimized_v2`,
      confidence_boost: confidenceBoost,
      applied_techniques: [
        ...advancedEnhancements.techniques,
        'anti_repetition_measures',
        'rfp_focused_guidance',
        'section_specific_keywords',
        'context_aware_enhancement'
      ],
      context_enhancements: [
        ...contextEnhancements.enhancements,
        ...antiRepetitionEnhancements.enhancements,
        ...rfpFocusedEnhancements.enhancements
      ]
    };
  }

  private static enhancePromptStructure(
    prompt: string,
    optimization: {
      keywords: string[];
      structure: string;
      tone: string;
      avoid: string[];
      maxWords: number;
    }
  ): string {
    // Add section-specific guidance with anti-repetition and anti-hallucination focus
    const avoidList = optimization.avoid?.join(', ') || 'generic superlatives';
    const maxWords = optimization.maxWords || 500;
    
    const enhancedPrompt = `${prompt}

SECTION-SPECIFIC OPTIMIZATION:
- Focus Areas: ${optimization.keywords.join(', ')}
- Structure Guidance: ${optimization.structure}
- Tone: ${optimization.tone}
- MAXIMUM WORDS: ${maxWords} (exceeding this indicates verbosity)

PHRASES TO AVOID IN THIS SECTION:
${avoidList}

QUALITY REQUIREMENTS:
- Provide specific, actionable content UNIQUE to this section (no overlap with others)
- Every statistic must cite knowledge base source or be removed
- Maximum ${maxWords} words - conciseness demonstrates competence
- Each paragraph serves exactly ONE purpose
- No sentence over 30 words
- No more than one adjective per noun

EVIDENCE REQUIREMENTS:
- Claims about capabilities must reference specific past projects
- Team qualifications must include verifiable credentials
- Timelines must use specific dates, not ranges
- Costs must sum correctly with clear line item breakdown`;

    return enhancedPrompt;
  }

  private static addContextualEnhancements(
    prompt: string,
    sectionType: string,
    project: any,
    existingSections: any[]
  ): { prompt: string; enhancements: string[] } {
    const enhancements: string[] = [];
    let enhancedPrompt = prompt;

    // Project context enhancement
    if (project.analysis) {
      enhancedPrompt += `\n\nPROJECT CONTEXT:\n- Client: ${project.title}\n- Key Requirements: Focus on addressing the specific needs identified in the RFP analysis\n- Strategic Priorities: Align content with client's stated objectives`;
      enhancements.push('project_context_integration');
    }

    // Existing sections consistency
    if (existingSections.length > 0) {
      const sectionTitles = existingSections.map(s => s.section_title).join(', ');
      enhancedPrompt += `\n\nCONSISTENCY REQUIREMENTS:\n- Maintain consistency with existing sections: ${sectionTitles}\n- Reference and build upon information already presented\n- Avoid contradictions with previously established content`;
      enhancements.push('cross_section_consistency');
    }

    // Section-specific contextual additions
    const sectionContext = this.getSectionSpecificContext(sectionType, existingSections);
    if (sectionContext) {
      enhancedPrompt += `\n\n${sectionContext}`;
      enhancements.push('section_specific_context');
    }

    return { prompt: enhancedPrompt, enhancements };
  }

  private static applyAdvancedTechniques(
    prompt: string,
    sectionType: string
  ): { prompt: string; techniques: string[] } {
    const techniques: string[] = [];
    let enhancedPrompt = prompt;

    // Chain-of-thought prompting
    enhancedPrompt += `\n\nGENERATION APPROACH:\n1. First, analyze the RFP requirements for this section
2. Identify the most relevant knowledge base content
3. Structure your response to directly address each requirement
4. Include specific examples and evidence
5. Conclude with clear value proposition`;
    techniques.push('chain_of_thought');

    // Few-shot examples for complex sections
    if (sectionType === 'technical' || sectionType === 'executive') {
      const example = this.getExampleStructure(sectionType);
      enhancedPrompt += `\n\nEXAMPLE STRUCTURE:\n${example}`;
      techniques.push('few_shot_examples');
    }

    // Constraint-based generation
    enhancedPrompt += `\n\nCONSTRAINTS:\n- Length: Provide comprehensive coverage without unnecessary verbosity
- Specificity: Use concrete details rather than generic statements
- Evidence: Support all claims with knowledge base content
- Client Focus: Always relate back to client needs and benefits`;
    techniques.push('constraint_based_generation');

    return { prompt: enhancedPrompt, techniques };
  }

  private static getSectionSpecificContext(
    sectionType: string,
    existingSections: any[]
  ): string | null {
    switch (sectionType) {
      case 'executive':
        return 'EXECUTIVE SUMMARY CONTEXT:\n- Synthesize key points from all other sections\n- Focus on high-level strategic value\n- Include compelling business case';
      
      case 'technical':
        const hasTeamSection = existingSections.find(s => 
          s.section_title.toLowerCase().includes('team')
        );
        return hasTeamSection ? 
          'TECHNICAL CONTEXT:\n- Reference team capabilities mentioned in team section\n- Align technical approach with stated team expertise' : 
          'TECHNICAL CONTEXT:\n- Include team capability requirements in technical approach';
      
      case 'pricing':
        return 'PRICING CONTEXT:\n- Justify costs based on technical complexity and team expertise\n- Reference value propositions from executive summary if available';
      
      default:
        return null;
    }
  }

  private static getExampleStructure(sectionType: string): string {
    const examples = {
      'technical': `1. Technical Approach Overview
   - Methodology selection and rationale
   - Architecture and design principles
   
2. Implementation Strategy
   - Phase-by-phase approach
   - Integration considerations
   - Quality assurance measures
   
3. Technology Stack and Tools
   - Specific technologies and justification
   - Compatibility and scalability factors`,

      'executive': `1. Project Understanding
   - Clear articulation of client needs
   - Strategic objectives alignment
   
2. Our Solution
   - High-level approach and benefits
   - Unique value proposition
   
3. Expected Outcomes
   - Quantifiable benefits
   - Success metrics and ROI`
    };

    return examples[sectionType] || '';
  }

  private static calculateConfidenceBoost(
    originalPrompt: string,
    optimizedPrompt: string,
    sectionType: string
  ): number {
    let boost = 0.1; // Base improvement

    // Length and structure improvements
    const lengthIncrease = (optimizedPrompt.length - originalPrompt.length) / originalPrompt.length;
    boost += Math.min(lengthIncrease * 0.1, 0.15);

    // Section-specific enhancements
    const optimization = this.OPTIMIZATION_TECHNIQUES[sectionType];
    if (optimization) {
      const keywordCount = optimization.keywords.filter(keyword =>
        optimizedPrompt.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      boost += keywordCount * 0.02;
    }

    // Advanced technique applications
    if (optimizedPrompt.includes('GENERATION APPROACH')) boost += 0.05;
    if (optimizedPrompt.includes('EXAMPLE STRUCTURE')) boost += 0.08;
    if (optimizedPrompt.includes('CONSTRAINTS:')) boost += 0.03;

    return Math.min(boost, 0.4); // Cap at 40% boost
  }

  private static addAntiRepetitionMeasures(
    prompt: string,
    existingSections: any[],
    currentSectionTitle: string
  ): { prompt: string; enhancements: string[] } {
    const enhancements: string[] = [];
    let enhancedPrompt = prompt;

    if (existingSections.length > 0) {
      const existingContent = existingSections.map(s => s.content).join('\n\n');
      const keyPoints = this.extractKeyPoints(existingContent);
      
      if (keyPoints.length > 0) {
        enhancedPrompt += `\n\nANTI-REPETITION MEASURES:\n- AVOID repeating these key points already covered in other sections: ${keyPoints.join(', ')}\n- Focus on NEW and UNIQUE aspects for the ${currentSectionTitle} section\n- If referencing previous sections, add new depth or perspective rather than repeating\n- Ensure this section provides distinct value that complements but doesn't duplicate other sections`;
        enhancements.push('anti_repetition_guidance');
      }
    }

    return { prompt: enhancedPrompt, enhancements };
  }

  private static addRFPFocusedGuidance(
    prompt: string,
    sectionType: string,
    projectAnalysis: string
  ): { prompt: string; enhancements: string[] } {
    const enhancements: string[] = [];
    let enhancedPrompt = prompt;

    if (projectAnalysis) {
      // Extract key RFP requirements and concerns from the analysis
      const concerns = this.extractRFPConcerns(projectAnalysis);
      const requirements = this.extractRFPRequirements(projectAnalysis, sectionType);
      
      if (concerns.length > 0 || requirements.length > 0) {
        enhancedPrompt += `\n\nRFP-FOCUSED GUIDANCE:\n`;
        
        if (requirements.length > 0) {
          enhancedPrompt += `- Address these specific RFP requirements: ${requirements.join(', ')}\n`;
        }
        
        if (concerns.length > 0) {
          enhancedPrompt += `- Address these client concerns: ${concerns.join(', ')}\n`;
        }
        
        enhancedPrompt += `- Demonstrate clear understanding of client's business challenges\n- Position solutions as direct responses to stated needs\n- Use persuasive language that builds confidence in your capabilities`;
        
        enhancements.push('rfp_requirements_mapping', 'client_concern_addressing');
      }
    }

    return { prompt: enhancedPrompt, enhancements };
  }

  private static extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];
    
    // Extract frequently mentioned concepts
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const wordFreq: { [key: string]: number } = {};
    
    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      words.forEach(word => {
        if (!this.isStopWord(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
    });
    
    // Get top 5 most frequent meaningful terms
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return sortedWords;
  }

  private static extractRFPConcerns(analysis: string): string[] {
    const concerns: string[] = [];
    const concernPatterns = [
      /concern[s]?\s+about\s+([^.]+)/gi,
      /worried\s+about\s+([^.]+)/gi,
      /challenge[s]?\s+with\s+([^.]+)/gi,
      /problem[s]?\s+with\s+([^.]+)/gi,
      /risk[s]?\s+of\s+([^.]+)/gi
    ];
    
    concernPatterns.forEach(pattern => {
      const matches = analysis.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          concerns.push(match[1].trim());
        }
      }
    });
    
    return concerns.slice(0, 3); // Top 3 concerns
  }

  private static extractRFPRequirements(analysis: string, sectionType: string): string[] {
    const requirements: string[] = [];
    
    // Section-specific requirement extraction
    const sectionKeywords = {
      'executive': ['objective', 'goal', 'outcome', 'result'],
      'technical': ['requirement', 'specification', 'standard', 'compliance'],
      'team': ['experience', 'qualification', 'expertise', 'personnel'],
      'timeline': ['deadline', 'milestone', 'schedule', 'delivery'],
      'pricing': ['budget', 'cost', 'pricing', 'value']
    };
    
    const keywords = sectionKeywords[sectionType] || ['requirement'];
    
    keywords.forEach(keyword => {
      const pattern = new RegExp(`${keyword}[s]?[^.]{20,80}`, 'gi');
      const matches = analysis.match(pattern) || [];
      requirements.push(...matches.slice(0, 2));
    });
    
    return requirements;
  }

  private static isStopWord(word: string): boolean {
    const stopWords = ['will', 'with', 'this', 'that', 'they', 'them', 'their', 'been', 'have', 'has', 'had', 'were', 'was', 'are', 'and', 'the', 'for', 'our', 'can', 'may'];
    return stopWords.includes(word.toLowerCase());
  }

  // Future: Learn from performance metrics
  static updatePromptPerformance(
    sectionType: string,
    promptHash: string,
    qualityScore: number,
    confidence: number,
    success: boolean
  ): void {
    // This would integrate with a storage system to track prompt performance
    // For now, we'll log the metrics for future implementation
    console.log('Prompt Performance Update:', {
      sectionType,
      promptHash,
      qualityScore,
      confidence,
      success
    });
  }

  // Generate a hash for prompt tracking
  static generatePromptHash(prompt: string): string {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
