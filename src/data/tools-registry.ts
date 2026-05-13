import { FileText, CalendarClock, TrendingUp, ListChecks, type LucideIcon } from "lucide-react";

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
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const getRelatedTools = (slug: string, count = 3) =>
  TOOLS.filter((t) => t.slug !== slug).slice(0, count);
