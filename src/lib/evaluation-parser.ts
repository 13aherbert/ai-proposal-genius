/**
 * Utility to parse evaluation markdown into structured feedback data
 */

export interface SectionFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface ParsedEvaluation {
  sectionFeedback: Map<string, SectionFeedback>;
  priorityRecommendations: string[];
  overallScore: number;
  winProbability: 'Low' | 'Medium' | 'High' | 'Unknown';
}

/**
 * Parse the evaluation markdown text into structured data
 */
export function parseEvaluation(evaluationText: string): ParsedEvaluation {
  const result: ParsedEvaluation = {
    sectionFeedback: new Map(),
    priorityRecommendations: [],
    overallScore: 0,
    winProbability: 'Unknown'
  };

  if (!evaluationText) return result;

  // Extract priority recommendations (numbered items)
  const priorityMatch = evaluationText.match(/## 4\. PRIORITY IMPROVEMENT RECOMMENDATIONS([\s\S]*?)(?=## 5\.|$)/i);
  if (priorityMatch) {
    const recommendations = priorityMatch[1]
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
    result.priorityRecommendations = recommendations;
  }

  // Extract overall score
  const scoreMatch = evaluationText.match(/Summary score[:\s]*(\d+)/i);
  if (scoreMatch) {
    result.overallScore = parseInt(scoreMatch[1], 10);
  }

  // Extract win probability
  const probMatch = evaluationText.match(/Win probability[:\s]*(Low|Medium|High)/i);
  if (probMatch) {
    result.winProbability = probMatch[1] as 'Low' | 'Medium' | 'High';
  }

  // Extract section-by-section feedback
  const sectionFeedbackMatch = evaluationText.match(/## 3\. SECTION-BY-SECTION FEEDBACK([\s\S]*?)(?=## 4\.|$)/i);
  if (sectionFeedbackMatch) {
    const feedbackText = sectionFeedbackMatch[1];
    const lines = feedbackText.split('\n');
    
    let currentSection = '';
    let currentFeedback: SectionFeedback = { strengths: [], weaknesses: [], suggestions: [] };
    
    for (const line of lines) {
      // Check for section headers (bold or ### format)
      const sectionHeader = line.match(/^(?:###?\s*)?(?:\*\*)?([A-Za-z\s]+?)(?:\*\*)?[:|-]/);
      if (sectionHeader && !line.toLowerCase().includes('work') && !line.toLowerCase().includes('improve')) {
        if (currentSection) {
          result.sectionFeedback.set(currentSection, currentFeedback);
        }
        currentSection = sectionHeader[1].trim();
        currentFeedback = { strengths: [], weaknesses: [], suggestions: [] };
        continue;
      }
      
      const trimmedLine = line.trim();
      if (!trimmedLine || !currentSection) continue;
      
      // Categorize the feedback
      if (trimmedLine.toLowerCase().includes('work') && trimmedLine.toLowerCase().includes('well')) {
        // Strengths section starts
        continue;
      } else if (trimmedLine.toLowerCase().includes('need') && trimmedLine.toLowerCase().includes('improve')) {
        // Weaknesses section starts
        continue;
      } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const content = trimmedLine.replace(/^[-•]\s*/, '').trim();
        if (content.toLowerCase().includes('strong') || content.toLowerCase().includes('well') || content.toLowerCase().includes('good')) {
          currentFeedback.strengths.push(content);
        } else if (content.toLowerCase().includes('weak') || content.toLowerCase().includes('missing') || content.toLowerCase().includes('lack')) {
          currentFeedback.weaknesses.push(content);
        } else {
          currentFeedback.suggestions.push(content);
        }
      }
    }
    
    // Don't forget the last section
    if (currentSection) {
      result.sectionFeedback.set(currentSection, currentFeedback);
    }
  }

  return result;
}

/**
 * Get feedback relevant to a specific section title
 */
export function getSectionRelevantFeedback(
  sectionTitle: string,
  parsed: ParsedEvaluation
): string {
  const sectionLower = sectionTitle.toLowerCase();
  const feedbackParts: string[] = [];

  // Look for direct section matches
  for (const [section, feedback] of parsed.sectionFeedback) {
    if (section.toLowerCase().includes(sectionLower) || sectionLower.includes(section.toLowerCase())) {
      if (feedback.strengths.length > 0) {
        feedbackParts.push(`Strengths: ${feedback.strengths.join('; ')}`);
      }
      if (feedback.weaknesses.length > 0) {
        feedbackParts.push(`Weaknesses: ${feedback.weaknesses.join('; ')}`);
      }
      if (feedback.suggestions.length > 0) {
        feedbackParts.push(`Suggestions: ${feedback.suggestions.join('; ')}`);
      }
    }
  }

  // Add relevant priority recommendations
  const relevantRecs = parsed.priorityRecommendations.filter(rec => 
    rec.toLowerCase().includes(sectionLower)
  );
  if (relevantRecs.length > 0) {
    feedbackParts.push(`Priority Recommendations: ${relevantRecs.join('; ')}`);
  }

  return feedbackParts.length > 0 
    ? feedbackParts.join('\n')
    : 'Apply general improvements for clarity, specificity, and professional tone.';
}

/**
 * Get a summary of changes that will be made
 */
export function getImprovementSummary(parsed: ParsedEvaluation): string[] {
  const summary: string[] = [];
  
  if (parsed.priorityRecommendations.length > 0) {
    summary.push(...parsed.priorityRecommendations.slice(0, 5));
  }
  
  if (summary.length === 0) {
    summary.push('Apply general improvements based on evaluation feedback');
  }
  
  return summary;
}
