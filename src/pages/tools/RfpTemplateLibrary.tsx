import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSEO } from "@/hooks/use-seo";
import { Search, FileText, Download, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  TEMPLATES, INDUSTRY_FILTERS, TEMPLATE_COUNT, TOTAL_DOWNLOADS,
} from "@/data/rfp-templates";

const SITE = "https://optirfp.ai";

const FAQS = [
  { q: "Are these RFP templates really free?", a: "Yes — every template is 100% free to download. No signup, no email gate, no watermark. Use them on as many bids as you like." },
  { q: "Can I customize these templates?", a: "Fully. The .docx is a standard Microsoft Word file — edit text, add your branding, restructure sections. The PDF is a print-ready reference copy." },
  { q: "What format are the templates in?", a: "Every template downloads as Word (.docx) or PDF. Word is best for editing; PDF is best for sharing a clean reference copy with your team." },
  { q: "Do you have a template for my industry?", a: "We cover IT services, software, construction, consulting, healthcare, government (federal & SLED), marketing, manufacturing and financial services. If your industry isn't listed, the Generic RFP template gives you a sector-neutral starting point." },
  { q: "Will the generated template have my logo?", a: "Templates ship with placeholder text and a clean cover page. Drop your logo into the Word file's header — most teams do this once and save it as their internal master." },
];

export default function RfpTemplateLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<typeof INDUSTRY_FILTERS[number]["id"]>("all");

  useSEO({
    title: "Free RFP Template Library | 25+ Industry Templates | OptiRFP",
    description: "Download free, professional RFP templates for IT, construction, software, consulting, healthcare, and government. Word, PDF, and Google Docs formats.",
    canonical: `${SITE}/tools/rfp-template-library`,

    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "Free RFP Template Library",
          description: "Curated library of free, downloadable RFP response templates across every major industry.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE}/tools/rfp-template-library`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@type": "Dataset",
          name: "OptiRFP Free RFP Template Library",
          description: `Collection of ${TEMPLATE_COUNT} free RFP response templates spanning IT, construction, software, consulting, healthcare, government, marketing, manufacturing and financial services.`,
          url: `${SITE}/tools/rfp-template-library`,
          keywords: ["rfp template", "proposal template", "rfp response template", "free rfp template"],
          creator: { "@type": "Organization", name: "OptiRFP.ai" },
          license: "https://optirfp.ai/terms",
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE}/tools` },
            { "@type": "ListItem", position: 3, name: "RFP Template Library", item: `${SITE}/tools/rfp-template-library` },
          ],
        },
      ],
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      if (filter !== "all" && t.industry !== filter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.industryLabel.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/tools" className="hover:text-foreground">Free Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">RFP Template Library</span>
        </nav>

        {/* Hero */}
        <header className="mb-8 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Free RFP Template Library
          </h1>
          <p className="text-lg text-muted-foreground mb-5">
            Professional, ready-to-use RFP response templates for every industry. Download instantly, customize easily.
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-brand-green mb-6">
            <CheckCircle2 className="h-4 w-4" /> 100% free — no signup required
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates by industry or keyword..."
              className="pl-10 h-12 text-base"
              aria-label="Search templates"
            />
          </div>

          {/* Stats */}
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{TEMPLATE_COUNT}+</strong> templates · {" "}
            <strong className="text-foreground">{TOTAL_DOWNLOADS.toLocaleString()}+</strong> downloads · {" "}
            <strong className="text-foreground">100%</strong> free
          </p>
        </header>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {INDUSTRY_FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-background border-border hover:border-brand-green/60"
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No templates match your search. Try a different keyword or clear the filter.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <Card
                key={t.slug}
                className="p-5 flex flex-col hover:border-brand-green/50 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {t.industryLabel}
                  </span>
                </div>
                <h3 className="font-semibold mb-1 leading-tight">{t.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  {t.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="inline-flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" /> {t.downloads.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {t.rating.toFixed(1)}
                  </span>
                  <span>{t.pages} pages</span>
                </div>
                <Button asChild className="w-full">
                  <Link to={`/tools/rfp-template-library/${t.slug}`}>
                    Preview & download <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* SEO content */}
        <section className="mt-16 prose prose-invert max-w-3xl mx-auto dark:prose-invert">
          <h2 className="text-2xl font-semibold mb-4">What is a Request for Proposal (RFP)?</h2>
          <div className="text-muted-foreground space-y-3 leading-relaxed">
            <p>A Request for Proposal (RFP) is a formal document a buyer issues to invite vendors to submit a proposal for a defined product or service. RFPs spell out the buyer's requirements, evaluation criteria, contractual terms and submission instructions — vendors respond with a structured proposal showing exactly how they will meet each requirement and at what price.</p>
            <p>RFPs are standard in government procurement (federal, state, local), enterprise IT purchases, construction, professional services and increasingly SaaS. A strong RFP response demonstrates compliance with every stated requirement, a credible technical approach, qualified personnel and competitive, defensible pricing.</p>
            <p>The right template gives you a defensible, evaluator-friendly skeleton so you spend your time on win themes — not formatting.</p>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">How to use these RFP templates</h2>
          <ol className="text-muted-foreground space-y-2 list-decimal pl-5">
            <li>Pick the template that best matches your industry, or use the Generic RFP template as a starting point.</li>
            <li>Download in Word (.docx) for editing, or PDF for sharing a clean reference copy with your team.</li>
            <li>Replace the cover page with your branding and the placeholder solicitation number with the real one.</li>
            <li>Map every shall/must/will requirement in the RFP to a section in your response — add a compliance matrix appendix.</li>
            <li>Have a second reader review for compliance, clarity and pricing math before submitting.</li>
          </ol>

          <h2 className="text-2xl font-semibold mt-10 mb-4">RFP template FAQ</h2>
          <div className="space-y-4 not-prose">
            {FAQS.map((f) => (
              <Card key={f.q} className="p-4">
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Upgrade CTA */}
        <Card className="mt-12 p-8 bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/30">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            Responding to RFPs? Do it 10x faster with AI
          </h2>
          <p className="text-muted-foreground mb-6">
            Templates give you a starting page. OptiRFP gives you a compliant first draft generated from the real RFP — every shall statement tracked, every section grounded in your knowledge base.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Feature</th>
                  <th className="text-left p-2 font-medium">Templates</th>
                  <th className="text-left p-2 font-medium text-brand-green">OptiRFP.ai</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["Create RFP response", "Manual fill-in", "AI-generated from RFP"],
                  ["Response time", "Hours to days", "Minutes"],
                  ["Compliance check", "Self-review", "Auto shall-statement matrix"],
                  ["Knowledge reuse", "Copy/paste", "Searchable knowledge base"],
                  ["Collaboration", "Email + tracked changes", "Real-time multi-user"],
                ].map(([f, a, b]) => (
                  <tr key={f} className="border-b last:border-0">
                    <td className="p-2 text-foreground font-medium">{f}</td>
                    <td className="p-2">{a}</td>
                    <td className="p-2 text-foreground">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button asChild size="lg">
            <Link to="/auth">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
