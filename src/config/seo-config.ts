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
} satisfies Record<string, SEOProps>;

export type SeoKey = keyof typeof SEO_CONFIG;
