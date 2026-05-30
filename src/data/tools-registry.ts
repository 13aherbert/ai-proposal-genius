import { FileText, CalendarClock, TrendingUp, ListChecks, Hash, Tag, Sparkles, IdCard, Scale, GitBranch, BookA, Gauge, FileStack, Library, BookOpen, Wand2, ClipboardCheck, type LucideIcon } from "lucide-react";

export interface ToolFAQ {
  q: string;
  a: string;
}

export type ToolCategory =
  | "Calculators"
  | "Generators"
  | "Lookups"
  | "Templates"
  | "Guides"
  | "AI Tools";

export interface ToolMeta {
  slug: string;
  title: string;          // H1 / display
  seoTitle: string;       // <title>
  description: string;    // short hub blurb
  metaDescription: string;// meta description
  keywords: string[];
  category: ToolCategory;
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
  {
    slug: "capability-statement-generator",
    title: "Capability Statement Generator",
    seoTitle: "Free Capability Statement Generator | Federal 1-Pager",
    description: "Build a federal-ready capability statement in minutes — live preview, instant PDF print, no signup.",
    metaDescription: "Free capability statement generator for federal contractors. Enter your company info, core competencies, NAICS, UEI/CAGE and past performance to generate a printable 1-page capability statement.",
    keywords: ["capability statement generator", "capability statement template", "federal capability statement", "govcon capability statement"],
    icon: IdCard,
    faqs: [
      { q: "What is a capability statement?", a: "A capability statement is a 1-page marketing document federal contracting officers use to evaluate small businesses. It lists your core competencies, past performance, differentiators, NAICS/PSC codes, and SAM.gov identifiers (UEI/CAGE)." },
      { q: "Why do federal buyers ask for one?", a: "Capability statements are required at industry days, before sources-sought responses, and to be added to many agency vendor lists. They are also the most common attachment to a cold-outreach email to a federal contracting officer." },
      { q: "Can I export it as a PDF?", a: "Yes. Use your browser's Print → Save as PDF — the layout is optimised for US Letter, single page, no header/footer. The page also supports printing directly to paper." },
      { q: "Do I have to fill in every field?", a: "No. Only the company name and core competencies are required. NAICS, PSC, UEI, CAGE, certifications and past performance are optional but strongly recommended for federal opportunities." },
    ],
  },
  {
    slug: "bid-no-bid-scorecard",
    title: "Bid / No-Bid Scorecard",
    seoTitle: "Free Bid / No-Bid Scorecard Template",
    description: "Score any opportunity across 12 weighted criteria and get an instant bid / no-bid recommendation.",
    metaDescription: "Free bid / no-bid scorecard. Score any RFP across 12 weighted criteria (fit, win probability, capacity, strategic value) and get an instant go / no-go recommendation with exportable summary.",
    keywords: ["bid no bid scorecard", "bid no bid template", "go no go decision proposal", "bid no bid checklist"],
    icon: Scale,
    faqs: [
      { q: "What is a bid / no-bid decision?", a: "Bid / no-bid (also called go / no-go) is the formal decision to pursue or pass on a given RFP. Disciplined bid / no-bid is the single biggest lever on proposal win rate — most teams chase too many opportunities they can't win." },
      { q: "How is the score calculated?", a: "Each criterion is rated 1–5 and multiplied by its category weight (Strategic Fit 30%, Win Probability 30%, Capacity 20%, Value 20%). The weighted total is mapped to Bid (≥70), Caution (50–69), or No-Bid (<50)." },
      { q: "Can I customise the criteria?", a: "Not in the free tool — the 12 criteria are the most-used industry standards. Inside OptiRFP, you can edit weights and add custom criteria per opportunity type, and the score is saved against the project." },
    ],
  },
  {
    slug: "proposal-outline-generator",
    title: "AI Proposal Outline Generator",
    seoTitle: "Free AI Proposal Outline Generator",
    description: "Paste an RFP excerpt and instantly get a structured proposal outline with page counts and key questions to answer.",
    metaDescription: "Free AI proposal outline generator. Paste an RFP excerpt and instantly produce a structured outline with section titles, page allocations and the key questions each section must answer.",
    keywords: ["proposal outline generator", "rfp outline template", "ai proposal outline", "proposal outline template"],
    icon: GitBranch,
    faqs: [
      { q: "What does the outline include?", a: "Each section has a number, title, target page count, and 2–4 bullet questions the writer must answer. The structure mirrors what a federal or commercial evaluator expects to see in the same order as the RFP's instructions to offerors." },
      { q: "How long can my pasted RFP be?", a: "Up to 12,000 characters of RFP text. For longer RFPs, paste the Sections L (instructions) and M (evaluation) only — that's all the AI needs to build the outline." },
      { q: "Will it match my page limit?", a: "Yes. Enter your total page limit and the AI allocates pages across sections proportionally to evaluation weight. Inside OptiRFP, the full editor enforces the limit at write time." },
    ],
  },
  {
    slug: "govcon-acronym-decoder",
    title: "GovCon Acronym Decoder",
    seoTitle: "Government Contracting Acronym Decoder | 500+ Terms",
    description: "Browse 500+ federal contracting acronyms or paste an RFP and decode every acronym inline.",
    metaDescription: "Free government contracting acronym decoder. Search 500+ federal acquisition acronyms (FAR, DFARS, SAM, NAICS, IDIQ, CDRL, CLIN, BPA, RFI) or paste an RFP to highlight and define every acronym automatically.",
    keywords: ["government contracting acronyms", "federal acquisition acronyms", "rfp acronyms", "far acronyms", "govcon glossary"],
    icon: BookA,
    faqs: [
      { q: "How many acronyms are in the dictionary?", a: "Over 500 of the most-used federal acquisition, defence and civilian agency acronyms — drawn from the FAR, DFARS, DoD 5000 series and SAM.gov entity registration glossary." },
      { q: "How does the RFP decoder work?", a: "Paste any RFP text and the tool scans every capitalised 2–5-letter token. If the token matches the built-in dictionary, it is highlighted and listed below with its full definition." },
      { q: "Are state/local procurement acronyms included?", a: "Federal is the core focus. The most common SLED-side acronyms (RFP, RFQ, IFB, NIGP, etc.) are also included. For agency-specific glossaries, OptiRFP's knowledge base lets your team add private acronyms scoped to each customer." },
    ],
  },
  {
    slug: "plain-language-scorer",
    title: "Plain Language Readability Scorer",
    seoTitle: "Free Plain Language & Readability Scorer for Proposals",
    description: "Score proposal text for Flesch-Kincaid grade, passive voice and jargon — built for federal Plain Writing Act compliance.",
    metaDescription: "Free plain language and readability scorer for proposals. Paste any text to see Flesch Reading Ease, Flesch-Kincaid grade, Gunning Fog, passive-voice count and proposal jargon flags — aligned with the federal Plain Writing Act.",
    keywords: ["plain language checker", "flesch kincaid score", "readability score proposals", "plain writing act"],
    icon: Gauge,
    faqs: [
      { q: "What is the Plain Writing Act?", a: "The Plain Writing Act of 2010 requires federal agencies to write public-facing documents in clear, simple language. Many federal evaluators apply the same expectation to proposals — texts above a 10th-grade reading level usually need rewriting." },
      { q: "Which formulas does the tool use?", a: "Flesch Reading Ease, Flesch-Kincaid Grade Level, and Gunning Fog Index — the three formulas most cited in federal style guides and agency proposal evaluations." },
      { q: "What counts as proposal jargon?", a: "The tool flags overused proposal filler — 'leverage', 'synergize', 'world-class', 'best-of-breed', 'cutting-edge', 'robust solution' and similar terms that consistently lower evaluator scores. Customisable jargon lists are available inside OptiRFP." },
      { q: "Does it count passive voice?", a: "Yes. The tool counts auxiliary-verb passive constructions ('was approved', 'will be delivered') and gives a passive-voice percentage. Federal style guides recommend keeping passive voice below 10%." },
    ],
  },
  {
    slug: "rfp-response-template-generator",
    title: "RFP Response Template Generator",
    seoTitle: "Free RFP Response Template Generator | OptiRFP.ai",
    description: "Create professional RFP response templates in minutes. Select your industry and sections, download instantly as Word or PDF.",
    metaDescription: "Create professional RFP response templates instantly. Select your industry and sections, download free Word or PDF templates. No signup required.",
    keywords: ["rfp response template", "rfp template generator", "proposal template", "free rfp template"],
    icon: FileStack,
    faqs: [
      { q: "What is an RFP response template?", a: "An RFP response template is a pre-structured document containing the standard sections evaluators expect — executive summary, company overview, technical approach, pricing, team, past performance and compliance — with placeholder text and guidance you tailor for each bid." },
      { q: "Is the template really free?", a: "Yes. Pick your industry, choose your sections and download a Word (.docx) or PDF template instantly. No signup, no email gate, no watermark." },
      { q: "Does the template change by industry?", a: "Yes. The placeholder language, terminology and guidance notes adapt to your selected industry — IT Services, Construction, Consulting, Healthcare, Government and more — so the starting draft already speaks your evaluators' language." },
      { q: "Can I edit the template after download?", a: "Absolutely. The .docx is a fully editable Word document. The PDF is for reference. For AI-assisted drafting of the full response from a real RFP, use OptiRFP's main app." },
    ],
  },
  {
    slug: "rfp-template-library",
    title: "RFP Template Library",
    seoTitle: "Free RFP Template Library | 25+ Industry Templates | OptiRFP.ai",
    description: "Browse and download 25+ free RFP response templates by industry — Word and PDF, no signup required.",
    metaDescription: "Free RFP template library. Download professional RFP response templates for IT, construction, software, consulting, healthcare, government and more — in Word and PDF, 100% free.",
    keywords: ["rfp template library", "free rfp templates", "rfp response templates", "industry rfp templates"],
    icon: Library,
    faqs: [
      { q: "Are these RFP templates really free?", a: "Yes — every template is 100% free to download. No signup, no email gate, no watermark." },
      { q: "What formats are available?", a: "Every template ships as both Word (.docx) and PDF. Word is best for editing; PDF for sharing a clean reference copy." },
      { q: "Which industries are covered?", a: "IT services, software, construction, consulting, healthcare, government (federal & SLED), marketing, manufacturing, financial services and a sector-neutral generic template." },
      { q: "Can I customize a template after downloading?", a: "Fully. The .docx is a standard Microsoft Word file — replace the cover page, drop in your branding and tailor every section." },
    ],
  },
  {
    slug: "how-to-respond-to-an-rfp",
    title: "How to Respond to an RFP",
    seoTitle: "How to Respond to an RFP: Complete Guide (2026) | OptiRFP.ai",
    description: "Step-by-step interactive guide to writing winning RFP responses — checklists, Go/No-Go tool, timeline planner and time calculator included.",
    metaDescription: "Learn how to write winning RFP responses with our step-by-step guide. Includes checklists, timelines, templates, and best practices. Free resources included.",
    keywords: ["how to respond to an rfp", "rfp response guide", "winning rfp response", "rfp response process"],
    icon: BookOpen,
    faqs: [
      { q: "How long does it take to respond to an RFP?", a: "A typical mid-size RFP response takes 40–80 hours over 2–4 weeks. Complex federal proposals can run 200+ hours. The guide includes a calculator that estimates effort from page count, sections, team size and experience." },
      { q: "What are the steps to respond to an RFP?", a: "Six steps: understand the RFP, run a go/no-go decision, assemble your team, draft each section, run pink/red/gold reviews, and submit + follow up. Each step has an interactive checklist." },
      { q: "How do I decide whether to bid?", a: "Score five questions: past performance, capacity, buyer relationship, profitability, similar wins. 4+ Yes = bid, 2–3 = conditional, 0–1 = pass. The interactive Go/No-Go tool in the guide calculates this automatically." },
    ],
  },
  {
    slug: "ai-rfp-response-generator",
    title: "AI RFP Response Generator",
    seoTitle: "Free AI RFP Response Generator | Try the Demo | OptiRFP.ai",
    description: "Generate a professional RFP response with AI in seconds. Paste an RFP question, add your company info, see the AI draft — free demo.",
    metaDescription: "Generate professional RFP responses with AI. Try our free demo — paste an RFP question, add your company info, and see AI write a response in seconds.",
    keywords: ["ai rfp response generator", "ai proposal writer", "rfp response ai", "ai rfp writer"],
    icon: Wand2,
    faqs: [
      { q: "Is this AI RFP response generator really free?", a: "The demo is 100% free with no signup, limited to 3 generations per day per visitor. The full OptiRFP.ai product — unlimited generations, full-length responses, knowledge-base grounding — requires a free account with a 14-day trial." },
      { q: "How accurate are the AI-generated responses?", a: "The demo uses Google Gemini with a proposal-writing system prompt and produces a polished ~150-word teaser. The full product grounds every response in your uploaded knowledge base (past wins, capability statements, technical docs) so output cites real facts about your company." },
      { q: "Is my input data stored?", a: "No. The demo does not persist inputs or outputs. The full product runs on SOC 2-aligned infrastructure with AES-256 at rest, TLS 1.3 in transit and strict per-organization data isolation. Customer data is never used to train shared models." },
    ],
  },
  {
    slug: "rfp-go-no-go-decision-tool",
    title: "RFP Go/No-Go Decision Tool",
    seoTitle: "RFP Go/No-Go Decision Tool | Should You Bid? | OptiRFP.ai",
    description: "Answer 5 quick questions and get an objective bid / no-bid recommendation with factor-specific action items.",
    metaDescription: "Should you bid on that RFP? Answer 5 quick questions and get an objective bid/no-bid recommendation with specific action items. Free tool.",
    keywords: ["rfp go no go", "bid no bid decision tool", "should i bid on this rfp", "rfp decision tool"],
    icon: ClipboardCheck,
    faqs: [
      { q: "How does the Go/No-Go scoring work?", a: "Each of the five questions is worth 20 points: Yes = 20, Not Sure = 10, No = 0. A total of 80–100 is a Strong Bid, 40–70 is Conditional, and 0–30 is a Weak Bid you should probably pass on." },
      { q: "What 5 factors does the tool evaluate?", a: "Past performance match, timeline realism, buyer relationship, budget profitability, and similar wins in the last 24 months — the five factors that correlate most strongly with proposal win rate." },
      { q: "Can I share results with my team?", a: "Yes. Click Share to copy a URL that encodes your answers — anyone who opens it sees the same verdict and breakdown. You can also download a PDF report or print the page." },
      { q: "Is my data stored anywhere?", a: "No. Your answers live only in your browser (localStorage) and the optional share link. We do not send anything to a server." },
    ],
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const getRelatedTools = (slug: string, count = 3) =>
  TOOLS.filter((t) => t.slug !== slug).slice(0, count);
