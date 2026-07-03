/**
 * Single source of truth for per-route SEO metadata.
 *
 * Every public page imports its entry from here and renders
 * <SEO {...SEO_CONFIG.x} /> at the top of the component tree.
 *
 * Conventions:
 *  - Title ≤ 60 chars (Google truncates beyond ~600px)
 *  - Description 140–160 chars
 *  - Canonical always uses https://optirfp.ai (production domain)
 */
import type { SEOProps } from "@/components/SEO";

export const SITE_URL = "https://optirfp.ai";

const sa = (
  extra: Partial<Record<string, unknown>> = {},
): Record<string, unknown> => ({
  "@type": "SoftwareApplication",
  name: "OptiRFP",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan with 6 projects",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "124",
  },
  ...extra,
});

const breadcrumb = (
  trail: Array<{ name: string; path: string }>,
): Record<string, unknown> => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: `${SITE_URL}${t.path}`,
  })),
});

const comparison = (
  name: string,
  competitor: string,
  url: string,
): Record<string, unknown>[] => [
  sa({ url }),
  {
    "@type": "WebPage",
    name,
    url,
    about: { "@type": "Thing", name: `OptiRFP vs ${competitor}` },
  },
  breadcrumb([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare/loopio" },
    { name: competitor, path: url.replace(SITE_URL, "") },
  ]),
];

export const SEO_CONFIG = {
  // ─── Core marketing ──────────────────────────────────────────────
  home: {
    title: "OptiRFP — AI RFP Response Software | Win More Bids",
    description:
      "AI-powered RFP response software that writes winning proposals in minutes. Upload any RFP, get a compliant first draft instantly. Free plan with 6 projects.",
    canonical: `${SITE_URL}/`,
    schema: [
      {
        "@type": "Organization",
        name: "OptiRFP",
        url: SITE_URL,
        logo: `${SITE_URL}/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png`,
      },
      {
        "@type": "WebSite",
        name: "OptiRFP",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/blog?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      sa({ url: SITE_URL }),
    ],
  },

  pricing: {
    title: "OptiRFP Pricing — Free & Paid Plans | AI RFP Software",
    description:
      "Start free with 6 projects. Upgrade to Pro for $49/mo or Business for $99/mo. AI-powered RFP response software with no hidden fees.",
    canonical: `${SITE_URL}/pricing`,
    schema: sa({
      url: `${SITE_URL}/pricing`,
      offers: [
        { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "49", priceCurrency: "USD" },
        { "@type": "Offer", name: "Business", price: "99", priceCurrency: "USD" },
      ],
    }),
  },

  blog: {
    title: "RFP Tips & Proposal Writing Blog | OptiRFP",
    description:
      "Expert advice on RFP responses, proposal writing, government contracting, and AI-powered bidding strategies. Updated weekly.",
    canonical: `${SITE_URL}/blog`,
    schema: {
      "@type": "Blog",
      name: "OptiRFP Blog",
      url: `${SITE_URL}/blog`,
      description:
        "Expert advice on RFP responses, proposal writing, and government contracting.",
    },
  },

  tools: {
    title: "Free RFP Tools & Templates | OptiRFP",
    description:
      "20+ free tools to help you write better RFP responses faster. Templates, calculators, generators, and guides — no signup required.",
    canonical: `${SITE_URL}/tools`,
    schema: {
      "@type": "CollectionPage",
      name: "Free RFP Tools",
      url: `${SITE_URL}/tools`,
    },
  },

  // ─── Comparison pages ────────────────────────────────────────────
  compareLoopio: {
    title: "OptiRFP vs Loopio: Best RFP Software 2026 Comparison",
    description:
      "Compare OptiRFP and Loopio side-by-side. See pricing, features, AI capabilities, and why proposal teams are switching. Free trial available.",
    canonical: `${SITE_URL}/compare/loopio`,
    schema: comparison(
      "OptiRFP vs Loopio",
      "Loopio",
      `${SITE_URL}/compare/loopio`,
    ),
  },
  compareAutoRfp: {
    title: "OptiRFP vs AutoRFP.ai: AI RFP Software Comparison 2026",
    description:
      "Head-to-head comparison of OptiRFP and AutoRFP.ai. Pricing, features, AI quality, and ease of use. See which fits your team.",
    canonical: `${SITE_URL}/compare/autorfp`,
    schema: comparison(
      "OptiRFP vs AutoRFP.ai",
      "AutoRFP.ai",
      `${SITE_URL}/compare/autorfp`,
    ),
  },
  compareResponsive: {
    title: "OptiRFP vs Responsive (RFPIO): RFP Software Comparison",
    description:
      "Compare OptiRFP vs Responsive (formerly RFPIO). AI features, pricing, integrations, and user experience. Make the right choice.",
    canonical: `${SITE_URL}/compare/responsive`,
    schema: comparison(
      "OptiRFP vs Responsive",
      "Responsive",
      `${SITE_URL}/compare/responsive`,
    ),
  },
  compareProposify: {
    title: "OptiRFP vs Proposify: Proposal Software Comparison 2026",
    description:
      "OptiRFP vs Proposify — see how AI RFP response software compares to proposal design tools. Features, pricing, and use cases.",
    canonical: `${SITE_URL}/compare/proposify`,
    schema: comparison(
      "OptiRFP vs Proposify",
      "Proposify",
      `${SITE_URL}/compare/proposify`,
    ),
  },
  compareQvidian: {
    title: "OptiRFP vs Qvidian: RFP Response Management Comparison",
    description:
      "Compare OptiRFP and Qvidian (Upland). AI automation vs traditional RFP response management. Pricing, features, and ROI analysis.",
    canonical: `${SITE_URL}/compare/qvidian`,
    schema: comparison(
      "OptiRFP vs Qvidian",
      "Qvidian",
      `${SITE_URL}/compare/qvidian`,
    ),
  },
  comparePandaDoc: {
    title: "OptiRFP vs PandaDoc: Document & Proposal Comparison",
    description:
      "OptiRFP vs PandaDoc — AI RFP response software vs document automation. See which tool fits your proposal workflow.",
    canonical: `${SITE_URL}/compare/pandadoc`,
    schema: comparison(
      "OptiRFP vs PandaDoc",
      "PandaDoc",
      `${SITE_URL}/compare/pandadoc`,
    ),
  },

  // ─── Core marketing (added) ──────────────────────────────────────
  about: {
    title: "About OptiRFP — Why We Built AI RFP Software",
    description:
      "Meet the team behind OptiRFP and why we built an AI platform that helps proposal teams respond to RFPs in hours instead of weeks. Our story and mission.",
    canonical: `${SITE_URL}/about`,
    schema: { "@type": "AboutPage", name: "About OptiRFP", url: `${SITE_URL}/about` },
  },

  contact: {
    title: "Contact OptiRFP — Sales, Support & Partnerships",
    description:
      "Get in touch with the OptiRFP team. Questions about pricing, enterprise plans, white-label partnerships, or product support — we respond within one business day.",
    canonical: `${SITE_URL}/contact`,
    schema: { "@type": "ContactPage", name: "Contact OptiRFP", url: `${SITE_URL}/contact` },
  },

  faq: {
    title: "OptiRFP FAQ — AI RFP Software Questions Answered",
    description:
      "Answers to common questions about OptiRFP: how the AI drafts proposals, data security, the free plan, supported file types, team features, and billing.",
    canonical: `${SITE_URL}/faq`,
    schema: { "@type": "FAQPage", name: "OptiRFP FAQ", url: `${SITE_URL}/faq` },
  },

  securityPage: {
    title: "Security at OptiRFP — Encryption, SOC 2 & Data Privacy",
    description:
      "How OptiRFP protects your proposal data: encryption in transit and at rest, access controls, SOC 2 practices, and clear data-handling policies for AI features.",
    canonical: `${SITE_URL}/security`,
    schema: { "@type": "WebPage", name: "Security at OptiRFP", url: `${SITE_URL}/security` },
  },

  demo: {
    title: "OptiRFP Demo — See AI RFP Response Software in Action",
    description:
      "Watch OptiRFP analyze a real RFP and draft a compliant response in minutes. See the compliance matrix, knowledge base, and AI drafting workflow live.",
    canonical: `${SITE_URL}/demo`,
    schema: sa({ url: `${SITE_URL}/demo` }),
  },

  integrations: {
    title: "OptiRFP Integrations — HubSpot, Slack, Teams & Webhooks",
    description:
      "Connect OptiRFP to your stack. Sync deals from HubSpot, get proposal updates in Slack and Microsoft Teams, and automate workflows with webhooks and our API.",
    canonical: `${SITE_URL}/integrations`,
    schema: { "@type": "WebPage", name: "OptiRFP Integrations", url: `${SITE_URL}/integrations` },
  },

  whiteLabel: {
    title: "White-Label RFP Software for Agencies | OptiRFP",
    description:
      "Offer AI-powered RFP responses under your own brand. OptiRFP's white-label and embedded options let agencies and consultants deliver proposals at scale.",
    canonical: `${SITE_URL}/white-label`,
    schema: sa({ url: `${SITE_URL}/white-label` }),
  },

  lifetime: {
    title: "OptiRFP Lifetime Deal — Pay Once, Win RFPs Forever",
    description:
      "Get lifetime access to OptiRFP's AI RFP response platform for a one-time payment. All core features included with no monthly fees. Limited availability.",
    canonical: `${SITE_URL}/lifetime`,
    schema: sa({ url: `${SITE_URL}/lifetime` }),
  },

  apiDocs: {
    title: "OptiRFP API Documentation — Build RFP Integrations",
    description:
      "Public API reference for OptiRFP. Authenticate with API keys, manage projects, trigger AI proposal generation, and receive webhooks from your own tools.",
    canonical: `${SITE_URL}/api-docs`,
    schema: { "@type": "WebPage", name: "OptiRFP API Docs", url: `${SITE_URL}/api-docs` },
  },

  docs: {
    title: "OptiRFP Documentation — Guides & How-Tos",
    description:
      "Step-by-step documentation for every OptiRFP feature: uploading RFPs, building your knowledge base, compliance matrices, team collaboration, and exports.",
    canonical: `${SITE_URL}/docs`,
    schema: { "@type": "WebPage", name: "OptiRFP Documentation", url: `${SITE_URL}/docs` },
  },

  help: {
    title: "OptiRFP Help Center — Support & Troubleshooting",
    description:
      "Self-serve help for OptiRFP users. Troubleshooting, account and billing questions, feature walkthroughs, and how to contact support when you need a human.",
    canonical: `${SITE_URL}/help`,
    schema: { "@type": "WebPage", name: "OptiRFP Help Center", url: `${SITE_URL}/help` },
  },

  // ─── Resource pages (added) ──────────────────────────────────────
  whatIsAnRfp: {
    title: "What Is an RFP? Definition, Process & Examples (2026)",
    description:
      "A plain-English guide to Requests for Proposal: what an RFP is, how the process works, RFP vs RFI vs RFQ, and how vendors write responses that win.",
    canonical: `${SITE_URL}/resources/what-is-an-rfp`,
    schema: { "@type": "Article", headline: "What Is an RFP?", url: `${SITE_URL}/resources/what-is-an-rfp` },
  },

  rfpExamples: {
    title: "RFP Response Examples That Won — Samples & Analysis",
    description:
      "Study real RFP response examples with section-by-section analysis. See what winning executive summaries, technical approaches, and pricing sections look like.",
    canonical: `${SITE_URL}/resources/rfp-examples`,
    schema: { "@type": "Article", headline: "RFP Response Examples", url: `${SITE_URL}/resources/rfp-examples` },
  },

  rfpResponseTemplate: {
    title: "Free RFP Response Template — Download & Customize",
    description:
      "A proven RFP response template with every section buyers expect: cover letter, executive summary, compliance matrix, technical approach, and pricing tables.",
    canonical: `${SITE_URL}/resources/rfp-response-template`,
    schema: { "@type": "Article", headline: "RFP Response Template", url: `${SITE_URL}/resources/rfp-response-template` },
  },
} satisfies Record<string, SEOProps>;

export type SeoKey = keyof typeof SEO_CONFIG;
