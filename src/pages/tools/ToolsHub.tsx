import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { ArrowRight, Sparkles } from "lucide-react";
import { TOOLS } from "@/data/tools-registry";

const SITE = "https://optirfp.ai";

export default function ToolsHub() {
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free RFP & Proposal Tools",
    url: `${SITE}/tools`,
    description: "Free, no-signup tools for RFP and proposal teams: word counter, deadline calculator, win rate calculator, compliance matrix generator and more.",
    hasPart: TOOLS.map((t) => ({
      "@type": "SoftwareApplication",
      name: t.title,
      url: `${SITE}/tools/${t.slug}`,
      applicationCategory: "BusinessApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })),
  }), []);

  useSEO({
    title: "Free RFP & Proposal Tools | OptiRFP",
    description: "Free, no-signup tools for proposal teams — word counter, deadline calculator, win rate calculator, compliance matrix generator. Built by OptiRFP.",
    canonical: `${SITE}/tools`,
    structuredData,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-sm mb-4">
            <Sparkles className="h-4 w-4" /> Free forever — no signup
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Free Tools for RFP & Proposal Teams
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practical, browser-based tools to help you respond to RFPs faster. No account needed — open, use, ship.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.slug} to={`/tools/${t.slug}`} className="block group">
                <Card className="p-6 h-full hover:border-brand-green/50 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1 group-hover:text-brand-green transition-colors">
                        {t.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-3">{t.description}</p>
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

        <Card className="p-8 text-center bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/30">
          <h2 className="text-2xl font-semibold mb-2">Need more than tools?</h2>
          <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
            OptiRFP is the AI proposal platform that does all of this — and writes the proposal too. Free for your first 6 projects.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">Try OptiRFP free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
