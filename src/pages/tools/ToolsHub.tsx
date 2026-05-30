import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { ArrowRight, Sparkles } from "lucide-react";
import { TOOLS, getToolCategory, type ToolCategory } from "@/data/tools-registry";

const SITE = "https://optirfp.ai";

const CATEGORY_ORDER: ToolCategory[] = [
  "AI Tools",
  "Generators",
  "Calculators",
  "Templates",
  "Lookups",
  "Guides",
];

const CATEGORY_BLURB: Record<ToolCategory, string> = {
  "AI Tools":
    "AI-powered tools that draft RFP responses, outlines and proposal sections in seconds — no signup required.",
  Generators:
    "Generate compliance matrices, executive summaries and federal capability statements from your raw RFP text.",
  Calculators:
    "Quick browser-based calculators for word count, deadlines, win rate, readability and bid/no-bid scoring.",
  Templates:
    "Industry-specific RFP response templates and a 25+ template library — download as Word or PDF.",
  Lookups:
    "Searchable reference databases — NAICS codes, PSC codes and a 500+ government contracting acronym decoder.",
  Guides:
    "Long-form guides on how to write, review and submit winning RFP responses, with interactive checklists.",
};

export default function ToolsHub() {
  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, typeof TOOLS>();
    for (const t of TOOLS) {
      const cat = getToolCategory(t.slug);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      tools: map.get(c)!,
    }));
  }, []);

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Free RFP & Proposal Tools",
        url: `${SITE}/tools`,
        description:
          "Free, no-signup tools for RFP and proposal teams: word counter, deadline calculator, win rate calculator, compliance matrix generator, NAICS/PSC lookups, templates, AI response generator and more.",
        inLanguage: "en-US",
        isPartOf: { "@type": "WebSite", name: "OptiRFP", url: SITE },
      },
      {
        "@type": "ItemList",
        name: "Free RFP & Proposal Tools",
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE}/tools/${t.slug}`,
          name: t.title,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE}/tools` },
        ],
      },
    ],
  }), []);

  useSEO({
    title: "Free RFP & Proposal Tools | OptiRFP",
    description:
      "20+ free, no-signup tools for proposal teams — word counter, deadline calculator, win rate calculator, compliance matrix generator, NAICS lookup, AI response generator and more.",
    canonical: `${SITE}/tools`,
    structuredData,
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-sm mb-4">
            <Sparkles className="h-4 w-4" /> Free forever — no signup
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Free RFP & Proposal Tools
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {TOOLS.length}+ practical, browser-based tools to help proposal managers, federal
            contractors and bid teams respond to RFPs faster. Word counters, deadline calculators,
            NAICS lookups, compliance matrix generators, an AI RFP response generator and more —
            all 100% free.
          </p>
        </header>

        {grouped.map(({ category, tools }) => (
          <section key={category} className="mb-12" aria-labelledby={`cat-${category}`}>
            <div className="mb-5">
              <h2 id={`cat-${category}`} className="text-2xl font-semibold mb-1">
                {category}
              </h2>
              <p className="text-muted-foreground text-sm max-w-3xl">
                {CATEGORY_BLURB[category]}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map((t) => {
                const Icon = t.icon;
                return (
                  <Link key={t.slug} to={`/tools/${t.slug}`} className="block group">
                    <Card className="p-5 h-full hover:border-brand-green/50 hover:shadow-lg transition-all">
                      <div className="flex items-start gap-4">
                        <div className="h-11 w-11 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1 group-hover:text-brand-green transition-colors">
                            {t.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-2">{t.description}</p>
                          <span className="text-sm text-brand-green inline-flex items-center gap-1">
                            Open tool <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <Card className="p-8 text-center bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/30 mb-12">
          <h2 className="text-2xl font-semibold mb-2">Need more than free tools?</h2>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            OptiRFP is the AI proposal platform that does all of this — and writes the proposal
            too. Free for your first 6 projects.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">Try OptiRFP free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>

        {/* Footer link cloud — every tool, plain text anchors for internal SEO */}
        <nav aria-label="All free tools" className="border-t pt-8">
          <h2 className="text-lg font-semibold mb-3">All free RFP tools (A–Z)</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {[...TOOLS]
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((t) => (
                <li key={t.slug}>
                  <Link
                    to={`/tools/${t.slug}`}
                    className="text-muted-foreground hover:text-brand-green underline-offset-4 hover:underline"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
