import type { IndustryId, SectionId } from "@/lib/rfp-template-builder";

export interface RfpTemplate {
  slug: string;            // /tools/rfp-template-library/<slug>
  name: string;            // "IT Services RFP Template"
  industry: IndustryId;
  industryLabel: string;   // display label for industry tag/filter
  description: string;     // 2-line card description
  longDescription: string; // detail page description
  sections: SectionId[];   // sections included in the generated download
  downloads: number;       // social proof
  rating: number;          // 0-5
  pages: number;           // estimated page count
  lastUpdated: string;     // human label, e.g. "January 2026"
}

const BASE_SECTIONS: SectionId[] = [
  "executive-summary", "company-overview", "scope", "timeline", "pricing", "team",
];

const FULL_SECTIONS: SectionId[] = [
  ...BASE_SECTIONS, "past-performance", "risk", "qa", "compliance",
];

export const TEMPLATES: RfpTemplate[] = [
  // IT Services
  {
    slug: "it-services-rfp-template",
    name: "IT Services RFP Template",
    industry: "it-services", industryLabel: "IT Services",
    description: "Comprehensive RFP response template for managed IT services, infrastructure and support engagements.",
    longDescription: "Built for MSPs and IT services firms responding to mid-market and enterprise RFPs. Covers technical approach, SLAs, staffing, transition planning and pricing — with placeholder language tuned for evaluators in IT procurement.",
    sections: FULL_SECTIONS,
    downloads: 4218, rating: 4.9, pages: 14, lastUpdated: "January 2026",
  },
  {
    slug: "cybersecurity-rfp-template",
    name: "Cybersecurity RFP Template",
    industry: "it-services", industryLabel: "IT Services",
    description: "Response template for SOC, MDR, vCISO, penetration testing and security advisory bids.",
    longDescription: "Tailored for cybersecurity vendors responding to security services RFPs. Includes compliance framework references (NIST, ISO 27001, CIS), threat-model assumptions and incident-response staffing language.",
    sections: FULL_SECTIONS,
    downloads: 1962, rating: 4.8, pages: 16, lastUpdated: "January 2026",
  },
  {
    slug: "cloud-migration-rfp-template",
    name: "Cloud Migration RFP Template",
    industry: "it-services", industryLabel: "IT Services",
    description: "AWS, Azure and GCP migration response template with phased approach and risk plan.",
    longDescription: "Built for cloud consultancies. Covers discovery, 6Rs strategy, landing zone, application refactoring, FinOps and run/operate handover.",
    sections: FULL_SECTIONS,
    downloads: 1574, rating: 4.7, pages: 15, lastUpdated: "January 2026",
  },
  {
    slug: "help-desk-rfp-template",
    name: "Help Desk / Service Desk RFP Template",
    industry: "it-services", industryLabel: "IT Services",
    description: "Tier 1–3 support RFP response with SLA, staffing model and KPI commitments.",
    longDescription: "For help-desk and service-desk providers. Includes ticket volume assumptions, language for shift coverage, escalation matrix and CSAT/FCR commitments.",
    sections: BASE_SECTIONS, downloads: 892, rating: 4.6, pages: 12, lastUpdated: "December 2025",
  },

  // Software
  {
    slug: "saas-software-rfp-template",
    name: "SaaS Software RFP Template",
    industry: "software", industryLabel: "Software",
    description: "Vendor response template for SaaS platforms — covers functionality, security, integrations and pricing tiers.",
    longDescription: "Designed for SaaS sales teams responding to procurement RFPs. Covers product capability matrix, security/SOC 2 statements, integrations, implementation timeline and subscription pricing.",
    sections: FULL_SECTIONS, downloads: 3741, rating: 4.9, pages: 14, lastUpdated: "January 2026",
  },
  {
    slug: "custom-software-development-rfp-template",
    name: "Custom Software Development RFP Template",
    industry: "software", industryLabel: "Software",
    description: "Bespoke development RFP response with discovery, sprint plan and acceptance criteria.",
    longDescription: "For development shops bidding on bespoke builds. Covers discovery, agile delivery plan, T-shirt sizing, code ownership and warranty terms.",
    sections: FULL_SECTIONS, downloads: 2103, rating: 4.7, pages: 14, lastUpdated: "January 2026",
  },
  {
    slug: "mobile-app-development-rfp-template",
    name: "Mobile App Development RFP Template",
    industry: "software", industryLabel: "Software",
    description: "iOS, Android and cross-platform mobile RFP response with platform, store and lifecycle strategy.",
    longDescription: "For mobile shops. Covers iOS/Android/Flutter/React Native trade-offs, App Store / Play Store submission, analytics, push and post-launch support.",
    sections: BASE_SECTIONS, downloads: 1187, rating: 4.6, pages: 12, lastUpdated: "December 2025",
  },

  // Construction
  {
    slug: "construction-rfp-template",
    name: "Construction RFP Template",
    industry: "construction", industryLabel: "Construction",
    description: "General-contractor RFP response template for commercial, civil and design-build projects.",
    longDescription: "For GCs and design-build firms. Covers project understanding, schedule, safety plan, key personnel, subcontractor strategy and pricing.",
    sections: FULL_SECTIONS, downloads: 2854, rating: 4.8, pages: 16, lastUpdated: "January 2026",
  },
  {
    slug: "design-build-rfp-template",
    name: "Design-Build RFP Template",
    industry: "construction", industryLabel: "Construction",
    description: "Integrated design-build response with architectural concept, GMP pricing and delivery schedule.",
    longDescription: "For design-build teams. Includes design narrative, schematic concept, GMP pricing, risk register and integrated delivery schedule.",
    sections: FULL_SECTIONS, downloads: 1409, rating: 4.7, pages: 16, lastUpdated: "January 2026",
  },
  {
    slug: "civil-engineering-rfp-template",
    name: "Civil Engineering RFP Template",
    industry: "construction", industryLabel: "Construction",
    description: "Roads, utilities and site-development RFP response for civil engineering firms.",
    longDescription: "For civil engineering firms. Covers site investigation, design milestones, regulatory approvals, MOT plan and key personnel résumés.",
    sections: BASE_SECTIONS, downloads: 763, rating: 4.5, pages: 12, lastUpdated: "December 2025",
  },

  // Consulting
  {
    slug: "management-consulting-rfp-template",
    name: "Management Consulting RFP Template",
    industry: "consulting", industryLabel: "Consulting",
    description: "Strategy, ops and transformation consulting RFP response with workstream plan and team bios.",
    longDescription: "For strategy and management consultancies. Includes hypothesis-led approach, workstream plan, deliverable catalog and senior advisor bios.",
    sections: FULL_SECTIONS, downloads: 2390, rating: 4.8, pages: 14, lastUpdated: "January 2026",
  },
  {
    slug: "hr-consulting-rfp-template",
    name: "HR Consulting RFP Template",
    industry: "consulting", industryLabel: "Consulting",
    description: "HR advisory, comp & benefits and org design consulting response template.",
    longDescription: "For HR consultancies. Covers diagnostic, benchmark, recommendations, change management and adoption metrics.",
    sections: BASE_SECTIONS, downloads: 612, rating: 4.5, pages: 11, lastUpdated: "December 2025",
  },
  {
    slug: "financial-advisory-rfp-template",
    name: "Financial Advisory RFP Template",
    industry: "consulting", industryLabel: "Consulting",
    description: "M&A, valuation and transaction advisory response template with team and engagement plan.",
    longDescription: "For boutique financial advisors. Covers transaction approach, deal team, fee structure (retainer + success), conflicts and references.",
    sections: BASE_SECTIONS, downloads: 524, rating: 4.6, pages: 11, lastUpdated: "December 2025",
  },

  // Healthcare
  {
    slug: "healthcare-it-rfp-template",
    name: "Healthcare IT RFP Template",
    industry: "healthcare", industryLabel: "Healthcare",
    description: "EHR, interoperability and population-health IT RFP response template.",
    longDescription: "For health-IT vendors. Covers HIPAA/HITRUST posture, FHIR/HL7 interoperability, clinician workflow and patient-safety controls.",
    sections: FULL_SECTIONS, downloads: 1438, rating: 4.7, pages: 15, lastUpdated: "January 2026",
  },
  {
    slug: "medical-device-rfp-template",
    name: "Medical Device RFP Template",
    industry: "healthcare", industryLabel: "Healthcare",
    description: "Capital-equipment and medical device RFP response with regulatory and service plan.",
    longDescription: "For device manufacturers. Includes FDA 510(k) status, installation, training, biomed service and consumables pricing.",
    sections: BASE_SECTIONS, downloads: 619, rating: 4.5, pages: 12, lastUpdated: "December 2025",
  },
  {
    slug: "clinical-research-rfp-template",
    name: "Clinical Research / CRO RFP Template",
    industry: "healthcare", industryLabel: "Healthcare",
    description: "CRO response template for trial design, site management and biostatistics services.",
    longDescription: "For contract research organizations. Covers protocol design, site selection, monitoring, biostatistics and regulatory submission support.",
    sections: BASE_SECTIONS, downloads: 437, rating: 4.5, pages: 13, lastUpdated: "December 2025",
  },

  // Government
  {
    slug: "federal-government-rfp-template",
    name: "Federal Government RFP Template",
    industry: "government", industryLabel: "Government",
    description: "FAR-compliant federal RFP response with technical, management and price volumes.",
    longDescription: "For federal contractors responding under FAR Part 15. Structured as Technical / Management / Past Performance / Price volumes with compliance matrix appendix.",
    sections: FULL_SECTIONS, downloads: 5102, rating: 4.9, pages: 18, lastUpdated: "January 2026",
  },
  {
    slug: "state-local-government-rfp-template",
    name: "State & Local Government RFP Template",
    industry: "government", industryLabel: "Government",
    description: "SLED RFP response template covering qualifications, approach, pricing and references.",
    longDescription: "For state, local and education sales. Aligns with typical NIGP / NASPO question structures and includes M/WBE language placeholders.",
    sections: FULL_SECTIONS, downloads: 2487, rating: 4.8, pages: 14, lastUpdated: "January 2026",
  },
  {
    slug: "gsa-schedule-rfp-template",
    name: "GSA Schedule RFP Template",
    industry: "government", industryLabel: "Government",
    description: "GSA MAS task-order response template with labor categories, pricing and PoP language.",
    longDescription: "For GSA Schedule holders responding to task orders. Includes LCAT mapping, ceiling pricing, period-of-performance milestones and CPARS references.",
    sections: FULL_SECTIONS, downloads: 1764, rating: 4.7, pages: 14, lastUpdated: "January 2026",
  },

  // Marketing
  {
    slug: "marketing-agency-rfp-template",
    name: "Marketing Agency RFP Template",
    industry: "marketing", industryLabel: "Marketing",
    description: "Full-service agency-of-record response template with creative, media and measurement plan.",
    longDescription: "For agencies pitching AOR engagements. Covers strategic narrative, creative samples, media plan, measurement and team rate card.",
    sections: BASE_SECTIONS, downloads: 1893, rating: 4.7, pages: 12, lastUpdated: "January 2026",
  },
  {
    slug: "digital-marketing-rfp-template",
    name: "Digital Marketing RFP Template",
    industry: "marketing", industryLabel: "Marketing",
    description: "SEO, paid media and content marketing response template with channel-level pricing.",
    longDescription: "For digital agencies. Covers audit, channel strategy, content cadence, attribution model and monthly retainer pricing by channel.",
    sections: BASE_SECTIONS, downloads: 1247, rating: 4.6, pages: 11, lastUpdated: "December 2025",
  },

  // Manufacturing
  {
    slug: "manufacturing-rfp-template",
    name: "Manufacturing RFP Template",
    industry: "manufacturing", industryLabel: "Manufacturing",
    description: "Contract manufacturing and OEM RFP response with capability, quality and lead-time matrix.",
    longDescription: "For contract manufacturers. Covers manufacturing capability, quality system (ISO 9001 / AS9100), capacity, lead time and tooling investment.",
    sections: FULL_SECTIONS, downloads: 1052, rating: 4.7, pages: 14, lastUpdated: "January 2026",
  },

  // Financial
  {
    slug: "financial-services-rfp-template",
    name: "Financial Services RFP Template",
    industry: "financial", industryLabel: "Financial",
    description: "Banking, insurance and fintech RFP response with regulatory and risk control sections.",
    longDescription: "For banks, insurers and fintech vendors. Covers regulatory posture (SOX, GLBA, PCI), risk controls, model governance and SLA commitments.",
    sections: FULL_SECTIONS, downloads: 1318, rating: 4.7, pages: 14, lastUpdated: "January 2026",
  },

  // Other
  {
    slug: "generic-rfp-template",
    name: "Generic RFP Response Template",
    industry: "other", industryLabel: "Other",
    description: "Sector-neutral RFP response template suitable for any industry or use case.",
    longDescription: "When your bid doesn't fit a named vertical. Sector-neutral language across executive summary, approach, team, pricing and references.",
    sections: BASE_SECTIONS, downloads: 2761, rating: 4.6, pages: 11, lastUpdated: "January 2026",
  },
];

export const INDUSTRY_FILTERS: { id: "all" | IndustryId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "it-services", label: "IT Services" },
  { id: "construction", label: "Construction" },
  { id: "software", label: "Software" },
  { id: "consulting", label: "Consulting" },
  { id: "healthcare", label: "Healthcare" },
  { id: "government", label: "Government" },
  { id: "marketing", label: "Marketing" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "financial", label: "Financial" },
  { id: "other", label: "Other" },
];

export const getTemplate = (slug: string): RfpTemplate | undefined =>
  TEMPLATES.find((t) => t.slug === slug);

export const getRelatedTemplates = (slug: string, count = 3): RfpTemplate[] => {
  const t = getTemplate(slug);
  if (!t) return TEMPLATES.slice(0, count);
  const sameIndustry = TEMPLATES.filter((x) => x.industry === t.industry && x.slug !== slug);
  const others = TEMPLATES.filter((x) => x.industry !== t.industry);
  return [...sameIndustry, ...others].slice(0, count);
};

export const TEMPLATE_COUNT = TEMPLATES.length;
export const TOTAL_DOWNLOADS = TEMPLATES.reduce((s, t) => s + t.downloads, 0);
