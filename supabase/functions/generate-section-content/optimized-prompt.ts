import { Project } from './types.ts';
import { getSectionKeywords } from './smart-knowledge-filter.ts';

// Enhanced prompt generation with outline-driven content requirements
export function generateOptimizedPrompt(
  sectionTitle: string,
  project: Project,
  knowledgeContext: string,
  existingSections?: Array<{section_title: string, content: string}>,
  strictMode = false
): string {
  const sectionType = getSectionType(sectionTitle);
  
  // Extract outline requirements for this specific section
  const outlineRequirements = extractOutlineRequirements(project.proposal_outline, sectionTitle);
  const guidelines = getSectionGuidelines(sectionType, outlineRequirements);
  
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

  // ULTRA-STRICT mode instructions
  const strictModeInstructions = strictMode ? `
🚫 ULTRA-STRICT MODE - ANTI-HALLUCINATION PROTOCOL:
• Use ONLY information that appears EXACTLY in the knowledge base
• NEVER create, estimate, or infer numbers, percentages, or statistics
• NEVER combine separate facts to create new claims
• NEVER use words like "approximately," "around," "over," "more than" with numbers
• If ANY required information is missing, respond ONLY with "INSUFFICIENT_KNOWLEDGE_BASE_DATA"
• Every sentence must be verifiable against the provided knowledge base
• When in doubt, respond with "INSUFFICIENT_KNOWLEDGE_BASE_DATA"

FORBIDDEN ACTIONS:
❌ Creating specific numbers (years of experience, client counts, percentages)
❌ Combining facts from different knowledge entries  
❌ Making assumptions about company capabilities
❌ Using superlatives without exact knowledge base support
❌ Estimating timeframes, costs, or quantities

VERIFICATION CHECKLIST - Ask yourself for EVERY sentence:
✅ Does this exact information appear in the knowledge base?
✅ Am I combining facts that weren't already connected?
✅ Am I creating any new numbers or statistics?
If ANY answer is "yes" or "maybe" → Use "INSUFFICIENT_KNOWLEDGE_BASE_DATA"
` : '';

  return `Write the "${sectionTitle}" section for this RFP proposal:

PROJECT: ${project.title} | CLIENT: ${project.client_name || 'Not specified'}
${project.analysis ? `RFP SUMMARY: ${extractKeyAnalysisPoints(project.analysis)}` : ''}

${knowledgeContext}${consistencyContext}

${outlineRequirements ? `OUTLINE REQUIREMENTS FOR THIS SECTION:
${outlineRequirements}
YOU MUST ADDRESS EACH POINT ABOVE IN YOUR RESPONSE.

` : ''}${guidelines}

${strictModeInstructions}WRITING REQUIREMENTS:
• DETAILED AND THOROUGH: Provide comprehensive coverage without repetition or verbosity
• FORMAL TONE: Use professional, business-appropriate language throughout
• ACTIVE VOICE: Write using active voice constructions (e.g., "We deliver" not "Solutions are delivered")
• CLEAR AND DETAILED: Present information in a structured, easy-to-follow manner
• OUTLINE COMPLIANCE: Address every requirement specified in the outline section above
• CLIENT-FOCUSED: Start with specific client benefits and value propositions
• EVIDENCE-BASED: Include quantifiable results and unique differentiators from knowledge base
• NO FLUFF: Avoid section headers, meta-commentary, or unnecessary filler phrases
• LENGTH: Provide appropriate detail to thoroughly address all outline requirements (typically 300-800 words)

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

function getSectionGuidelines(sectionType: string, outlineRequirements?: string): string {
  const baseGuidelines: { [key: string]: string } = {
    executive: 'EXECUTIVE SUMMARY APPROACH: Lead with compelling value proposition addressing client\'s specific needs. Quantify anticipated benefits and outcomes. Present a clear narrative that demonstrates understanding of client requirements. Conclude with confident commitment to deliverables.',
    
    technical: 'TECHNICAL APPROACH: Begin by restating the client\'s technical challenge. Present your methodology in logical sequence with specific techniques and tools. Explain how each component addresses client requirements. Provide evidence of technical capability and proven results.',
    
    team: 'TEAM QUALIFICATIONS: Highlight team members\' directly relevant experience and achievements. Quantify results from similar projects. Demonstrate unique qualifications that differentiate your team. Show clear alignment between team capabilities and project requirements.',
    
    timeline: 'TIMELINE AND SCHEDULE: Present realistic delivery dates with detailed milestone breakdown. Show parallel work streams and dependencies. Include risk mitigation strategies and contingency plans. Demonstrate understanding of client\'s urgency and constraints.',
    
    pricing: 'PRICING STRATEGY: Lead with value delivered before presenting costs. Provide transparent, detailed cost breakdown. Justify pricing with ROI analysis and comparative value. Address budget considerations proactively.',
    
    company: 'COMPANY OVERVIEW: Focus on organizational capabilities directly relevant to this project. Present track record with similar clients and projects. Demonstrate stability, resources, and commitment. Include relevant certifications and industry recognition.',
    
    general: 'SECTION APPROACH: Begin with client-focused benefit statement. Support claims with specific evidence from knowledge base. Maintain logical flow addressing all outlined requirements. End with clear commitment or next step.'
  };
  
  let guidelines = baseGuidelines[sectionType] || baseGuidelines.general;
  
  // If we have specific outline requirements, emphasize following them
  if (outlineRequirements && outlineRequirements.trim().length > 0) {
    guidelines += '\n\nCRITICAL: You must address EVERY point listed in the outline requirements above. Structure your response to cover each requirement comprehensively while maintaining logical flow and readability.';
  }
  
  return guidelines;
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

// Extract outline requirements for a specific section
function extractOutlineRequirements(proposalOutline: string | null, sectionTitle: string): string {
  if (!proposalOutline || !sectionTitle) return '';
  
  const lines = proposalOutline.split('\n');
  let sectionFound = false;
  let requirements: string[] = [];
  let sectionDepth = 0;
  
  // Clean the section title for matching
  const cleanSectionTitle = sectionTitle
    .toLowerCase()
    .replace(/^(i{1,3}v?x?|v?i{0,3}|\d+)\.\s*/i, '') // Remove roman numerals and numbers
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Check if this line matches our section title
    const cleanLine = trimmed
      .toLowerCase()
      .replace(/^(#{1,6}|\d+\.|[ivxlc]+\.|\*|-)\s*/i, '') // Remove headers, numbers, bullets
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If we find a matching section
    if (cleanLine.includes(cleanSectionTitle) || cleanSectionTitle.includes(cleanLine)) {
      sectionFound = true;
      sectionDepth = getLineDepth(trimmed);
      continue;
    }
    
    // If we found our section, collect requirements until we hit the next section at the same depth
    if (sectionFound) {
      const currentDepth = getLineDepth(trimmed);
      
      // If we hit another section at the same or higher level, we're done
      if (currentDepth <= sectionDepth && (
        trimmed.match(/^#{1,6}\s/) || 
        trimmed.match(/^\d+\.\s/) || 
        trimmed.match(/^[ivxlc]+\.\s/i)
      )) {
        break;
      }
      
      // Collect sub-requirements and bullet points
      if (trimmed.match(/^[-*•]\s/) || 
          trimmed.match(/^#{4,6}\s/) || 
          trimmed.match(/^\d+\.\d+/) ||
          (currentDepth > sectionDepth && trimmed.length > 10)) {
        requirements.push(trimmed.replace(/^[-*•#]+\s*/, '').replace(/^\d+\.\d*\s*/, ''));
      }
    }
  }
  
  return requirements.length > 0 ? requirements.join('\n• ') : '';
}

// Get the hierarchical depth of a line based on its formatting
function getLineDepth(line: string): number {
  if (line.match(/^#{1,6}\s/)) {
    const matches = line.match(/^(#{1,6})/);
    return matches ? matches[1].length : 0;
  }
  if (line.match(/^\d+\.\s/)) return 1;
  if (line.match(/^[ivxlc]+\.\s/i)) return 1;
  if (line.match(/^\d+\.\d+/)) return 2;
  if (line.match(/^[-*•]\s/)) return 2;
  return 3;
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