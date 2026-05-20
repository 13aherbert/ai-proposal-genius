import { FileText, CalendarClock, TrendingUp, ListChecks, Hash, Tag, Sparkles, IdCard, Scale, GitBranch, BookA, Gauge, type LucideIcon } from "lucide-react";

export interface ToolFAQ {
  q: string;
  a: string;
}

export interface ToolMeta {
  slug: string;
  title: string;          // H1 / display
  seoTitle: string;       // <title>
  description: string;    // short hub blurb
  metaDescription: string;// meta description
  keywords: string[];
  icon: LucideIcon;
  faqs: ToolFAQ[];
}

export const TOOLS: ToolMeta[] = [
  {
    slug: "proposal-word-counter",
    title: "Proposal Word Counter",
    seoTitle: "Free Proposal Word Counter | RFP Word Count Tool",
    description: "Live word, character, sentence and page count for proposal text — strips HTML and tracks reading time.",
    metaDescription: "Free proposal word counter. Paste text or HTML to instantly see word count, characters, sentences, pages and reading time. No signup required.",
    keywords: ["proposal word counter", "rfp word count tool", "word count for proposals"],
    icon: FileText,
    faqs: [
      { q: "Is this proposal word counter free?", a: "Yes. It runs entirely in your browser — no signup, no data is uploaded." },
      { q: "Does it strip HTML from copied content?", a: "Yes. Pasted HTML or rich-text is stripped before counting so your numbers match what reviewers see." },
      { q: "How are pages estimated?", a: "We use a 500-words-per-page benchmark, the standard density for single-spaced 12pt proposal body copy." },
      { q: "Can I trust this for compliance page limits?", a: "Use it as a fast estimate. Always verify against the exact formatting required by the RFP (font, spacing, margins)." },
    ],
  },
  {
    slug: "rfp-deadline-calculator",
    title: "RFP Deadline Calculator",
    seoTitle: "RFP Deadline Calculator | Free Proposal Timeline Tool",
    description: "Enter the submission deadline and get a back-planned schedule of kickoff, draft, review and submit milestones.",
    metaDescription: "Free RFP deadline calculator. Back-plan your proposal timeline with kickoff, draft, review and submission milestones in business days.",
    keywords: ["rfp deadline calculator", "proposal timeline calculator", "rfp schedule planner"],
    icon: CalendarClock,
    faqs: [
      { q: "How does the deadline calculator work?", a: "Enter the RFP submission date and we back-plan five milestones (kickoff, outline, first draft, internal review, final) using business days only." },
      { q: "Does it skip weekends?", a: "Yes. All offsets count Monday–Friday only. Holidays are not excluded — review the schedule against your team calendar." },
      { q: "Can I export the schedule?", a: "You can copy the milestone list. For full automation, save the schedule directly inside an OptiRFP project." },
    ],
  },
  {
    slug: "win-rate-calculator",
    title: "Proposal Win Rate Calculator",
    seoTitle: "Proposal Win Rate Calculator | Free RFP Win Rate Tool",
    description: "Calculate your proposal win rate, projected revenue and how you stack up against industry benchmarks.",
    metaDescription: "Free proposal win rate calculator. Enter submitted vs won proposals to see your win rate, projected revenue and industry benchmarks.",
    keywords: ["proposal win rate calculator", "rfp win rate", "bid win rate"],
    icon: TrendingUp,
    faqs: [
      { q: "What is a good RFP win rate?", a: "Industry averages range 25%–45% depending on sector. Government services average ~30%, SaaS ~40%, professional services ~35%." },
      { q: "How is win rate calculated?", a: "Win rate = proposals won ÷ proposals submitted × 100. We also project annual revenue using your average contract value." },
      { q: "How can I improve my win rate?", a: "Focus on bid/no-bid discipline, reuse approved content, and shorten review cycles — exactly what OptiRFP automates." },
    ],
  },
  {
    slug: "compliance-matrix-generator",
    title: "Compliance Matrix Generator",
    seoTitle: "Free Compliance Matrix Generator for RFPs",
    description: "Paste RFP text, auto-extract every shall/must/will requirement, then export a CSV compliance matrix.",
    metaDescription: "Free compliance matrix generator. Paste an RFP and instantly extract every shall/must/will requirement into an editable, exportable CSV matrix.",
    keywords: ["compliance matrix generator", "rfp compliance matrix template", "shall statement extractor"],
    icon: ListChecks,
    faqs: [
      { q: "What is a compliance matrix?", a: "A compliance matrix maps every RFP requirement (shall/must/will statements) to your proposal response, owner and status — required by most government bids." },
      { q: "Which keywords does it extract?", a: "We extract sentences containing shall, must, will, should and is required to — the standard imperatives in federal and state RFPs." },
      { q: "Can I edit the matrix?", a: "Yes. Every row is editable. Add owners, statuses and section numbers, then export to CSV for your proposal binder." },
    ],
  },
  {
    slug: "naics-code-lookup",
    title: "NAICS Code Lookup",
    seoTitle: "NAICS Code Lookup 2022 | Free Search Tool",
    description: "Search the full 2022 NAICS code list by code or keyword. Find your industry classification in seconds.",
    metaDescription: "Free NAICS code lookup. Search the official 2022 NAICS list (2,125 codes) by code or keyword to find the right industry classification for federal contracts, SAM.gov, and tax filings.",
    keywords: ["naics code lookup", "naics code search", "2022 naics codes", "naics classification"],
    icon: Hash,
    faqs: [
      { q: "What is a NAICS code?", a: "A NAICS code (North American Industry Classification System) is a 2-to-6 digit number used by US federal agencies to classify businesses by industry. It is required for SAM.gov registration, federal bids, and many state procurements." },
      { q: "Which NAICS edition does this tool use?", a: "We use the official 2022 NAICS edition published by the US Census Bureau — the version currently in force for SAM.gov, federal contracting, and most agency systems." },
      { q: "How do I pick the right NAICS code?", a: "Search by the keyword that best describes your primary revenue activity, then pick the most specific (6-digit) code that matches. You can list multiple NAICS codes on SAM.gov, but one must be designated as primary." },
      { q: "Is this related to NIGP or PSC codes?", a: "No — NAICS is the federal industry standard. NIGP codes are used by many state and local governments, and PSC codes are used inside federal contracts to classify the product or service being purchased. Use our PSC Code Lookup for that." },
    ],
  },
  {
    slug: "psc-code-lookup",
    title: "PSC Code Lookup",
    seoTitle: "PSC Code Lookup | Free Product Service Code Search",
    description: "Search the full GSA Product Service Code list by code or keyword to classify federal contract opportunities.",
    metaDescription: "Free PSC code lookup tool. Search the official GSA Product and Service Codes by code or keyword to identify the right classification for federal contract opportunities and SAM.gov bids.",
    keywords: ["psc code lookup", "product service code search", "gsa psc codes", "federal psc code"],
    icon: Tag,
    faqs: [
      { q: "What is a PSC code?", a: "A Product Service Code (PSC) is a 4-character code used by US federal agencies on contract actions to identify what is being bought — a product, a service, or research and development." },
      { q: "How is PSC different from NAICS?", a: "NAICS classifies the contractor's industry. PSC classifies what the government is purchasing on a specific contract. Federal opportunities on SAM.gov list both." },
      { q: "Where does this PSC list come from?", a: "We use the GSA's official Product and Service Codes Manual, filtered to only show codes that are currently active." },
      { q: "Can I search by category?", a: "Yes — type a category keyword (for example 'IT services', 'construction', 'medical') and the lookup returns every active PSC code that matches." },
    ],
  },
  {
    slug: "executive-summary-generator",
    title: "Executive Summary Generator",
    seoTitle: "Free AI Executive Summary Generator for Proposals",
    description: "Paste your proposal context and get a polished executive summary in seconds — powered by AI, no signup required.",
    metaDescription: "Free AI executive summary generator. Paste a proposal, RFP excerpt, or project brief and instantly produce a polished, concise executive summary in your chosen tone and length.",
    keywords: ["executive summary generator", "ai executive summary", "proposal executive summary", "free executive summary tool"],
    icon: Sparkles,
    faqs: [
      { q: "Is this executive summary generator free?", a: "Yes. No signup, no payment, no email required. Paste your text and get a summary." },
      { q: "What should I paste in?", a: "Anything that gives the AI context about your proposal — the RFP excerpt, your draft response, a project brief, or a list of bullets covering your approach, differentiators, and outcomes." },
      { q: "How long are the generated summaries?", a: "You can target 150–400 words. The AI keeps a single-page executive summary structure: opening hook, problem understanding, solution, proof, and call to action." },
      { q: "Will the AI hallucinate facts?", a: "It only synthesises from the context you paste in. Always review and edit before sending — for production-grade proposals with full source grounding, OptiRFP's full editor uses the same AI plus your knowledge base." },
    ],
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const getRelatedTools = (slug: string, count = 3) =>
  TOOLS.filter((t) => t.slug !== slug).slice(0, count);
