import { Project } from './types.ts';
import { getSectionKeywords } from './smart-knowledge-filter.ts';

// Streamlined prompt generation for token optimization
export function generateOptimizedPrompt(
  sectionTitle: string,
  project: Project,
  knowledgeContext: string,
  existingSections?: Array<{section_title: string, content: string}>,
  strictMode = false
): string {
  const sectionType = getSectionType(sectionTitle);
  const guidelines = getSectionGuidelines(sectionType);
  
  // Condensed consistency context
  let consistencyContext = '';
  if (existingSections && existingSections.length > 0) {
    consistencyContext = `\nEXISTING SECTIONS - MAINTAIN CONSISTENCY:\n`;
  existingSections.forEach(section => {
    // Only include key information, not full content
    if (section.content) {
      const keyInfo = extractKeyInfo(section.content);
      consistencyContext += `${section.section_title}: ${keyInfo}\n`;
    }
  });
  }

  // Streamlined strict mode (much shorter)
  const strictModeInstructions = strictMode ? `
STRICT MODE: Use ONLY verified knowledge base information. If insufficient data, respond with "INSUFFICIENT_KNOWLEDGE_BASE_DATA".
` : '';

  return `Write the "${sectionTitle}" section for this RFP proposal:

PROJECT: ${project.title} | CLIENT: ${project.client_name || 'Not specified'}
${project.analysis ? `RFP SUMMARY: ${extractKeyAnalysisPoints(project.analysis)}` : ''}

${knowledgeContext}${consistencyContext}

${guidelines}

${strictModeInstructions}REQUIREMENTS:
• 200-500 words unless section requires more detail
• Start with specific client benefit
• Include quantifiable results and differentiators  
• Use confident, active voice
• No section headers, meta-commentary, or filler phrases

Generate the section content:`;
}

function getSectionType(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary')) return 'executive';
  if (title.includes('technical') || title.includes('approach')) return 'technical';  
  if (title.includes('team') || title.includes('personnel')) return 'team';
  if (title.includes('timeline') || title.includes('schedule')) return 'timeline';
  if (title.includes('cost') || title.includes('price')) return 'pricing';
  if (title.includes('company') || title.includes('about')) return 'company';
  
  return 'general';
}

function getSectionGuidelines(sectionType: string): string {
  const guidelines: { [key: string]: string } = {
    executive: 'EXECUTIVE: Lead with value proposition, quantify benefits, end with call to action.',
    technical: 'TECHNICAL: Problem → Solution → Benefit → Proof. Include specific methodologies.',
    team: 'TEAM: Highlight relevant achievements with quantified results and unique qualifications.',
    timeline: 'TIMELINE: Show final delivery date, parallel workflows, and risk mitigation.',
    pricing: 'PRICING: Lead with value delivered, transparent breakdown, ROI justification.',
    company: 'COMPANY: Focus on relevant capabilities, experience, and client success stories.',
    general: 'GENERAL: Start with client benefit, support with evidence, end with commitment.'
  };
  
  return guidelines[sectionType] || guidelines.general;
}

function extractKeyAnalysisPoints(analysis: any): string {
  if (typeof analysis === 'string' && analysis) {
    // Extract first 2 sentences as key points
    const sentences = analysis.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('. ') + '.';
  }
  
  if (typeof analysis === 'object' && analysis !== null) {
    // Extract key requirements or points
    const keyPoints = [];
    
    if (analysis.key_requirements) {
      keyPoints.push(...analysis.key_requirements.slice(0, 3));
    }
    
    if (analysis.summary && typeof analysis.summary === 'string') {
      keyPoints.push(analysis.summary.split('.')[0]);
    }
    
    return keyPoints.join('; ') || 'RFP analysis available';
  }
  
  return 'RFP analysis available';
}

function extractKeyInfo(content: string | null): string {
  // Extract key information from existing sections (pricing, dates, capabilities)
  if (!content || typeof content !== 'string') {
    return 'Content available';
  }
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Look for quantifiable information
  const keyInfo = sentences.filter(sentence => {
    const s = sentence.toLowerCase();
    return s.includes('$') || 
           s.includes('%') || 
           s.includes('days') || 
           s.includes('weeks') || 
           s.includes('months') ||
           s.includes('years of') ||
           s.includes('certified') ||
           s.includes('experience');
  });
  
  // Return first 2 key pieces of information, or first sentence if no quantifiable data
  if (keyInfo.length > 0) {
    return keyInfo.slice(0, 2).join('; ') + '.';
  } else {
    return sentences[0] ? sentences[0].trim() + '.' : 'Content available';
  }
}