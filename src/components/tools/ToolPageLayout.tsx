import { ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getRelatedTools, TOOLS, type ToolMeta } from "@/data/tools-registry";

interface ToolPageLayoutProps {
  tool: ToolMeta;
  howItWorks: string[];
  whyItMatters: ReactNode;
  children: ReactNode; // the interactive tool
}

const SITE = "https://optirfp.ai";

export function ToolPageLayout({ tool, howItWorks, whyItMatters, children }: ToolPageLayoutProps) {
  const canonical = `${SITE}/tools/${tool.slug}`;
  const related = getRelatedTools(tool.slug);

  const linkCloud = useMemo(
    () => TOOLS.filter((t) => t.slug !== tool.slug).slice(0, 12),
    [tool.slug],
  );

  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: tool.seoTitle,
        description: tool.metaDescription,
        inLanguage: "en-US",
        isPartOf: { "@type": "WebSite", name: "OptiRFP", url: SITE },
      },
      {
        "@type": "SoftwareApplication",
        name: tool.title,
        description: tool.metaDescription,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: canonical,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "127",
        },
      },
      {
        "@type": "HowTo",
        name: `How to use the ${tool.title}`,
        description: tool.description,
        step: howItWorks.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: `Step ${i + 1}`,
          text: s,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.faqs.map((f) => ({
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
          { "@type": "ListItem", position: 3, name: tool.title, item: canonical },
        ],
      },
    ],
  }), [tool, canonical, howItWorks]);

  useSEO({
    title: tool.seoTitle,
    description: tool.metaDescription,
    canonical,
    structuredData,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/tools" className="hover:text-foreground">Free Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{tool.title}</span>
        </nav>

        {/* Hero */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{tool.title}</h1>
          <p className="text-lg text-muted-foreground mb-3">{tool.description}</p>
          <p className="inline-flex items-center gap-2 text-sm text-brand-green">
            <CheckCircle2 className="h-4 w-4" /> 100% free — no signup required
          </p>
        </header>

        {/* Tool */}
        <Card className="p-6 mb-12">{children}</Card>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-3">
            {howItWorks.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Why it matters */}
        <section className="mb-12 prose prose-invert max-w-none dark:prose-invert">
          <h2 className="text-2xl font-semibold mb-4">Why it matters</h2>
          <div className="text-muted-foreground space-y-4 leading-relaxed">{whyItMatters}</div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {tool.faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/30">
          <h2 className="text-2xl font-semibold mb-2">Want this automated across every RFP?</h2>
          <p className="text-muted-foreground mb-4">
            OptiRFP analyses every RFP, drafts compliant responses and tracks every shall statement — free for your first 6 projects.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>

        {/* Related */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Related free tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.slug} to={`/tools/${r.slug}`} className="block">
                  <Card className="p-5 h-full hover:border-brand-green/50 transition-colors">
                    <Icon className="h-6 w-6 text-brand-green mb-2" />
                    <h3 className="font-semibold mb-1">{r.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* More free tools — text link cloud for internal SEO */}
        <section aria-label="More free tools" className="mb-4 border-t pt-6">
          <h2 className="text-lg font-semibold mb-3">More free tools for proposal teams</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {linkCloud.map((r) => (
              <li key={r.slug}>
                <Link
                  to={`/tools/${r.slug}`}
                  className="text-muted-foreground hover:text-brand-green underline-offset-4 hover:underline"
                >
                  {r.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/tools"
                className="text-brand-green hover:underline underline-offset-4 font-medium"
              >
                Browse all free RFP tools →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
