
import { 
  Building2, 
  Users, 
  Trophy, 
  Wrench, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  GitBranch, 
  MessageSquareQuote, 
  Briefcase, 
  Scale, 
  Cpu 
} from "lucide-react";
import { KnowledgeCategory } from "../types";

/**
 * Knowledge base categories optimized for proposal generation
 * Organized by proposal section alignment with priority levels
 * 
 * Essential: Required for most proposals
 * Recommended: Improves proposal quality
 * Optional: Helpful for specific RFP types
 */

export interface EnhancedKnowledgeCategory extends KnowledgeCategory {
  priority: 'essential' | 'recommended' | 'optional';
  proposalMapping: string[];
  description: string;
  samplePrompts: string[];
}

export const knowledgeCategories: KnowledgeCategory[] = [
  // Essential Categories (6)
  { icon: <Building2 className="h-4 w-4" />, name: "Company Overview & Mission" },
  { icon: <Users className="h-4 w-4" />, name: "Team Bios & Qualifications" },
  { icon: <Trophy className="h-4 w-4" />, name: "Past Performance & Case Studies" },
  { icon: <Wrench className="h-4 w-4" />, name: "Technical Capabilities" },
  { icon: <DollarSign className="h-4 w-4" />, name: "Pricing & Rates" },
  { icon: <Star className="h-4 w-4" />, name: "Differentiators & Value Props" },
  
  // Recommended Categories (2)
  { icon: <ShieldCheck className="h-4 w-4" />, name: "Certifications & Compliance" },
  { icon: <GitBranch className="h-4 w-4" />, name: "Process & Methodology" },
  
  // Optional Categories (4)
  { icon: <MessageSquareQuote className="h-4 w-4" />, name: "Client Testimonials" },
  { icon: <Briefcase className="h-4 w-4" />, name: "Industry Expertise" },
  { icon: <Scale className="h-4 w-4" />, name: "Legal & Terms" },
  { icon: <Cpu className="h-4 w-4" />, name: "Tools & Technology" },
];

export const enhancedKnowledgeCategories: EnhancedKnowledgeCategory[] = [
  // Essential Categories - Required for most proposals
  {
    icon: <Building2 className="h-4 w-4" />,
    name: "Company Overview & Mission",
    priority: 'essential',
    proposalMapping: ['Executive Summary', 'Company Background'],
    description: "Your company's story, mission, vision, and core values",
    samplePrompts: [
      "Company founding story and history",
      "Mission statement and vision",
      "Core values and culture",
      "Company size and locations"
    ]
  },
  {
    icon: <Users className="h-4 w-4" />,
    name: "Team Bios & Qualifications",
    priority: 'essential',
    proposalMapping: ['Team & Qualifications', 'Key Personnel'],
    description: "Bios, credentials, and experience of key team members",
    samplePrompts: [
      "Leadership team bios",
      "Key personnel resumes",
      "Team certifications and degrees",
      "Years of experience summaries"
    ]
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    name: "Past Performance & Case Studies",
    priority: 'essential',
    proposalMapping: ['Experience', 'Past Performance', 'Technical Approach'],
    description: "Previous project successes, case studies, and client outcomes",
    samplePrompts: [
      "Completed project case studies",
      "Client success metrics",
      "Similar project experience",
      "Awards and recognition"
    ]
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    name: "Technical Capabilities",
    priority: 'essential',
    proposalMapping: ['Technical Approach', 'Methodology', 'Capabilities'],
    description: "Your technical expertise, methodologies, and service offerings",
    samplePrompts: [
      "Service offerings overview",
      "Technical expertise areas",
      "Proprietary methodologies",
      "Technology stack and tools"
    ]
  },
  {
    icon: <DollarSign className="h-4 w-4" />,
    name: "Pricing & Rates",
    priority: 'essential',
    proposalMapping: ['Budget', 'Investment', 'Cost Proposal'],
    description: "Rate cards, pricing models, and cost structures",
    samplePrompts: [
      "Standard rate cards",
      "Pricing models (fixed, T&M, retainer)",
      "Volume discount structures",
      "Payment terms and conditions"
    ]
  },
  {
    icon: <Star className="h-4 w-4" />,
    name: "Differentiators & Value Props",
    priority: 'essential',
    proposalMapping: ['Why Choose Us', 'Executive Summary', 'Value Proposition'],
    description: "What makes your company unique and why clients choose you",
    samplePrompts: [
      "Unique selling propositions",
      "Competitive advantages",
      "Client benefit statements",
      "Innovation and thought leadership"
    ]
  },
  
  // Recommended Categories - Improves proposal quality
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    name: "Certifications & Compliance",
    priority: 'recommended',
    proposalMapping: ['Qualifications', 'Risk Mitigation', 'Compliance'],
    description: "Industry certifications, compliance standards, and security practices",
    samplePrompts: [
      "Industry certifications (ISO, SOC, etc.)",
      "Compliance frameworks",
      "Security practices and policies",
      "Insurance and bonding information"
    ]
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    name: "Process & Methodology",
    priority: 'recommended',
    proposalMapping: ['Technical Approach', 'Timeline', 'Project Management'],
    description: "Your project delivery approach, phases, and management practices",
    samplePrompts: [
      "Project delivery methodology",
      "Quality assurance processes",
      "Communication and reporting cadence",
      "Risk management approach"
    ]
  },
  
  // Optional Categories - Helpful for specific RFP types
  {
    icon: <MessageSquareQuote className="h-4 w-4" />,
    name: "Client Testimonials",
    priority: 'optional',
    proposalMapping: ['Why Choose Us', 'Past Performance', 'References'],
    description: "Client quotes, reviews, and reference letters",
    samplePrompts: [
      "Client testimonial quotes",
      "Reference letters",
      "NPS scores and ratings",
      "Client satisfaction surveys"
    ]
  },
  {
    icon: <Briefcase className="h-4 w-4" />,
    name: "Industry Expertise",
    priority: 'optional',
    proposalMapping: ['Technical Approach', 'Experience', 'Domain Knowledge'],
    description: "Deep expertise in specific industries or sectors",
    samplePrompts: [
      "Industry-specific experience",
      "Sector knowledge and trends",
      "Regulatory understanding",
      "Industry partnerships"
    ]
  },
  {
    icon: <Scale className="h-4 w-4" />,
    name: "Legal & Terms",
    priority: 'optional',
    proposalMapping: ['Terms & Conditions', 'Appendices', 'Legal'],
    description: "Standard contract terms, legal disclaimers, and policies",
    samplePrompts: [
      "Standard contract terms",
      "Legal disclaimers",
      "Warranty and liability terms",
      "Confidentiality agreements"
    ]
  },
  {
    icon: <Cpu className="h-4 w-4" />,
    name: "Tools & Technology",
    priority: 'optional',
    proposalMapping: ['Technical Approach', 'Capabilities', 'Infrastructure'],
    description: "Software, tools, and technology infrastructure you use",
    samplePrompts: [
      "Technology stack details",
      "Software and tools used",
      "Infrastructure capabilities",
      "Integration capabilities"
    ]
  },
];

// Category migration mapping (old -> new)
export const categoryMigrationMap: Record<string, string> = {
  "Company Boilerplates": "Company Overview & Mission",
  "Legal Disclaimers": "Legal & Terms",
  "Prior RFP Responses": "Past Performance & Case Studies",
  "Industry Benchmarks": "Industry Expertise",
  "Competitive Insights": "Differentiators & Value Props",
  "Pricing Templates": "Pricing & Rates",
  "Estimation Tools": "Process & Methodology",
  "Other Company Information": "Company Overview & Mission",
};

// Get essential categories only
export const getEssentialCategories = () => 
  enhancedKnowledgeCategories.filter(c => c.priority === 'essential');

// Get recommended categories
export const getRecommendedCategories = () => 
  enhancedKnowledgeCategories.filter(c => c.priority === 'recommended');

// Get optional categories
export const getOptionalCategories = () => 
  enhancedKnowledgeCategories.filter(c => c.priority === 'optional');
