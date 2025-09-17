import { KnowledgeEntry } from "./types.ts";

export interface KnowledgeGap {
  category: string;
  missingContent: string[];
  priority: 'high' | 'medium' | 'low';
  impact: string;
  recommendations: string[];
}

export interface KnowledgeGapAnalysis {
  gaps: KnowledgeGap[];
  coverageScore: number;
  recommendations: string[];
  criticalMissing: string[];
}

export function analyzeKnowledgeGaps(
  knowledgeEntries: KnowledgeEntry[],
  rfpRequirements: string,
  sectionType: string
): KnowledgeGapAnalysis {
  
  const gaps: KnowledgeGap[] = [];
  const criticalMissing: string[] = [];
  
  // Extract key topics from RFP requirements
  const requiredTopics = extractRequiredTopics(rfpRequirements, sectionType);
  
  // Analyze coverage for each required topic
  let coveredTopics = 0;
  
  requiredTopics.forEach(topic => {
    const coverage = assessTopicCoverage(knowledgeEntries, topic);
    
    if (coverage.score < 0.3) {
      gaps.push({
        category: sectionType,
        missingContent: [topic.name],
        priority: topic.priority,
        impact: `Limited ability to address ${topic.name} requirements effectively`,
        recommendations: generateRecommendations(topic, coverage)
      });
      
      if (topic.priority === 'high') {
        criticalMissing.push(topic.name);
      }
    } else {
      coveredTopics++;
    }
  });
  
  const coverageScore = Math.round((coveredTopics / requiredTopics.length) * 100);
  
  const overallRecommendations = generateOverallRecommendations(gaps, coverageScore);
  
  return {
    gaps,
    coverageScore,
    recommendations: overallRecommendations,
    criticalMissing
  };
}

interface RequiredTopic {
  name: string;
  priority: 'high' | 'medium' | 'low';
  keywords: string[];
}

function extractRequiredTopics(rfpText: string, sectionType: string): RequiredTopic[] {
  const topics: RequiredTopic[] = [];
  
  // Section-specific topic extraction
  const sectionTopics = getSectionSpecificTopics(sectionType);
  
  // Extract topics from RFP text based on common patterns
  const rfpLower = rfpText.toLowerCase();
  
  sectionTopics.forEach(topic => {
    const hasKeyword = topic.keywords.some(keyword => 
      rfpLower.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      topics.push(topic);
    }
  });
  
  // Extract explicit requirements (must, shall, required, etc.)
  const requirementPatterns = [
    /(?:must|shall|required?|mandatory)[^.!?]*([^.!?]+)/gi,
    /(?:deliverable|milestone|outcome)[^.!?]*([^.!?]+)/gi,
    /(?:experience|expertise|qualification)[^.!?]*([^.!?]+)/gi
  ];
  
  requirementPatterns.forEach(pattern => {
    const matches = rfpText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const topicName = extractTopicFromRequirement(match);
        if (topicName && !topics.find(t => t.name === topicName)) {
          topics.push({
            name: topicName,
            priority: 'high',
            keywords: [topicName.toLowerCase()]
          });
        }
      });
    }
  });
  
  return topics;
}

function getSectionSpecificTopics(sectionType: string): RequiredTopic[] {
  const topicMap: { [key: string]: RequiredTopic[] } = {
    executive: [
      { name: 'Company Overview', priority: 'high', keywords: ['company', 'organization', 'business', 'about us'] },
      { name: 'Value Proposition', priority: 'high', keywords: ['value', 'benefits', 'advantage', 'unique'] },
      { name: 'Industry Experience', priority: 'medium', keywords: ['experience', 'industry', 'sector', 'domain'] }
    ],
    technical: [
      { name: 'Technical Approach', priority: 'high', keywords: ['methodology', 'approach', 'process', 'framework'] },
      { name: 'Technology Stack', priority: 'high', keywords: ['technology', 'platform', 'tools', 'software'] },
      { name: 'Implementation Plan', priority: 'medium', keywords: ['implementation', 'deployment', 'rollout'] }
    ],
    team: [
      { name: 'Team Structure', priority: 'high', keywords: ['team', 'personnel', 'staff', 'resources'] },
      { name: 'Key Personnel', priority: 'high', keywords: ['key personnel', 'project manager', 'lead', 'senior'] },
      { name: 'Qualifications', priority: 'medium', keywords: ['qualifications', 'certifications', 'credentials'] }
    ],
    company: [
      { name: 'Company History', priority: 'medium', keywords: ['history', 'founded', 'established', 'background'] },
      { name: 'Capabilities', priority: 'high', keywords: ['capabilities', 'services', 'expertise', 'specialization'] },
      { name: 'Client References', priority: 'medium', keywords: ['clients', 'customers', 'references', 'testimonials'] }
    ],
    pricing: [
      { name: 'Cost Structure', priority: 'high', keywords: ['cost', 'price', 'fee', 'rate', 'budget'] },
      { name: 'Value Justification', priority: 'medium', keywords: ['value', 'roi', 'cost-benefit', 'investment'] }
    ],
    timeline: [
      { name: 'Project Schedule', priority: 'high', keywords: ['schedule', 'timeline', 'milestones', 'delivery'] },
      { name: 'Resource Allocation', priority: 'medium', keywords: ['resources', 'allocation', 'staffing'] }
    ]
  };
  
  return topicMap[sectionType] || topicMap.general || [];
}

function extractTopicFromRequirement(requirement: string): string | null {
  // Extract the main topic from a requirement sentence
  const cleaned = requirement
    .replace(/(?:must|shall|required?|mandatory)/gi, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim();
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length >= 2) {
    return words.slice(0, 3).join(' ');
  }
  
  return null;
}

interface TopicCoverage {
  score: number;
  matchingEntries: KnowledgeEntry[];
  gaps: string[];
}

function assessTopicCoverage(knowledgeEntries: KnowledgeEntry[], topic: RequiredTopic): TopicCoverage {
  const matchingEntries: KnowledgeEntry[] = [];
  let totalMatches = 0;
  
  knowledgeEntries.forEach(entry => {
    const content = `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase();
    let entryMatches = 0;
    
    topic.keywords.forEach(keyword => {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'gi'));
      if (matches) {
        entryMatches += matches.length;
      }
    });
    
    if (entryMatches > 0) {
      matchingEntries.push(entry);
      totalMatches += entryMatches;
    }
  });
  
  // Calculate coverage score based on matches and content depth
  const baseScore = Math.min(totalMatches * 0.1, 1.0);
  const contentDepthBonus = matchingEntries.length > 0 ? 
    Math.min(matchingEntries.reduce((sum, entry) => 
      sum + ((entry.content?.length || 0) + (entry.parsed_content?.length || 0))
    , 0) / 10000, 0.5) : 0;
  
  const score = Math.min(baseScore + contentDepthBonus, 1.0);
  
  return {
    score,
    matchingEntries,
    gaps: score < 0.3 ? [`Insufficient content for ${topic.name}`] : []
  };
}

function generateRecommendations(topic: RequiredTopic, coverage: TopicCoverage): string[] {
  const recommendations: string[] = [];
  
  if (coverage.score < 0.1) {
    recommendations.push(`Add comprehensive content about ${topic.name}`);
    recommendations.push(`Include specific examples and case studies related to ${topic.name}`);
  } else if (coverage.score < 0.3) {
    recommendations.push(`Expand existing content about ${topic.name}`);
    recommendations.push(`Add more specific details and quantifiable results`);
  }
  
  if (topic.priority === 'high') {
    recommendations.push(`This is a critical requirement - prioritize content development`);
  }
  
  return recommendations;
}

function generateOverallRecommendations(gaps: KnowledgeGap[], coverageScore: number): string[] {
  const recommendations: string[] = [];
  
  if (coverageScore < 30) {
    recommendations.push('Knowledge base has significant gaps that may impact proposal competitiveness');
    recommendations.push('Consider partnering with subject matter experts for missing capabilities');
  } else if (coverageScore < 60) {
    recommendations.push('Knowledge base covers basic requirements but needs enhancement');
    recommendations.push('Focus on adding depth and specific examples to existing content');
  } else if (coverageScore < 85) {
    recommendations.push('Knowledge base is well-positioned with minor gaps');
    recommendations.push('Address specific missing elements identified above');
  } else {
    recommendations.push('Knowledge base provides strong coverage for this proposal');
    recommendations.push('Consider adding competitive differentiators and unique value propositions');
  }
  
  const criticalGaps = gaps.filter(g => g.priority === 'high').length;
  if (criticalGaps > 0) {
    recommendations.push(`Address ${criticalGaps} critical gap(s) before proposal submission`);
  }
  
  return recommendations;
}