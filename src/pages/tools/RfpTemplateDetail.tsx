import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { toast } from "sonner";
import {
  ArrowRight, Download, Star, FileText, FileDown, CheckCircle2, Calendar, Layers,
} from "lucide-react";
import { getTemplate, getRelatedTemplates } from "@/data/rfp-templates";
import {
  SECTIONS, sectionBody, industryName, downloadDocx, downloadPdf,
} from "@/lib/rfp-template-builder";

const SITE = "https://optirfp.ai";

export default function RfpTemplateDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const template = getTemplate(slug);

  if (!template) {
    return <Navigate to="/tools/rfp-template-library" replace />;
  }

  return <TemplateDetailContent template={template} />;
}

function TemplateDetailContent({ template }: { template: NonNullable<ReturnType<typeof getTemplate>> }) {
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const canonical = `${SITE}/tools/rfp-template-library/${template.slug}`;
  const related = getRelatedTemplates(template.slug);

  useSEO({
    title: `Free ${template.name} | OptiRFP.ai`,
    description: `${template.description} Free download in Word and PDF — no signup required.`,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: template.name,
          description: template.longDescription,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: canonical,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: template.rating.toFixed(1),
            ratingCount: Math.max(20, Math.round(template.downloads / 30)),
            bestRating: "5",
          },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE}/tools` },
            { "@type": "ListItem", position: 3, name: "RFP Template Library", item: `${SITE}/tools/rfp-template-library` },
            { "@type": "ListItem", position: 4, name: template.name, item: canonical },
          ],
        },
      ],
    },
  });

  const filenameBase = template.slug.replace(/-+/g, "-");

  const handleDocx = async () => {
    setDownloading("docx");
    try {
      await downloadDocx("", template.industry, template.sections, `${filenameBase}.docx`);
      toast.success("Word template downloaded");
    } catch {
      toast.error("Download failed — please try again");
    } finally {
      setDownloading(null);
    }
  };

  const handlePdf = () => {
    setDownloading("pdf");
    try {
      downloadPdf("", template.industry, template.sections, `${filenameBase}.pdf`);
      toast.success("PDF template downloaded");
    } catch {
      toast.error("Download failed — please try again");
    } finally {
      setDownloading(null);
    }
  };

  const previewSections = useMemo(
    () => template.sections.slice(0, 4).map((id) => ({
      meta: SECTIONS.find((s) => s.id === id)!,
      body: sectionBody(id, template.industry),
    })),
    [template],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/tools" className="hover:text-foreground">Free Tools</Link>
          <span className="mx-2">/</span>
          <Link to="/tools/rfp-template-library" className="hover:text-foreground">Templates</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{template.industryLabel}</span>
        </nav>

        <header className="mb-8">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground mb-3">
            {template.industryLabel}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Free {template.name}
          </h1>
          <p className="text-lg text-muted-foreground mb-4">{template.longDescription}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <strong className="text-foreground">{template.rating.toFixed(1)}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Download className="h-4 w-4" /> {template.downloads.toLocaleString()} downloads
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-4 w-4" /> {template.pages} pages
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Updated {template.lastUpdated}
            </span>
            <span className="inline-flex items-center gap-1 text-brand-green">
              <CheckCircle2 className="h-4 w-4" /> Free — no signup
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-12">
          {/* Preview */}
          <Card className="p-6 bg-white text-black border max-h-[600px] overflow-auto">
            <div className="text-center pb-4 border-b mb-4">
              <h2 className="text-2xl font-bold">[Your Company Name]</h2>
              <p className="text-sm" style={{ color: "#1E40AF" }}>RFP Response</p>
              <p className="text-xs text-gray-500 mt-1">Industry: {industryName(template.industry)}</p>
              <p className="text-xs text-gray-500 italic mt-1">[RFP Title / Solicitation Number]</p>
            </div>
            <h3 className="font-semibold text-sm mb-2">Table of Contents</h3>
            <ol className="text-sm space-y-1 mb-6 list-decimal pl-5">
              {template.sections.map((id) => (
                <li key={id}>{SECTIONS.find((s) => s.id === id)!.title}</li>
              ))}
            </ol>
            {previewSections.map(({ meta, body }, i) => (
              <div key={meta.id} className="mb-5">
                <h3 className="font-semibold text-base" style={{ color: "#1E40AF" }}>
                  {i + 1}. {meta.title}
                </h3>
                <p className="italic text-xs text-gray-500 mt-1 mb-1">Guidance: {body.guidance}</p>
                <p className="text-sm leading-relaxed">{body.placeholder}</p>
              </div>
            ))}
            {template.sections.length > previewSections.length && (
              <p className="text-xs text-gray-500 italic text-center pt-2 border-t">
                + {template.sections.length - previewSections.length} more sections in the download
              </p>
            )}
          </Card>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="p-5 space-y-3">
              <h2 className="font-semibold">Download free</h2>
              <Button onClick={handleDocx} disabled={downloading !== null} size="lg" className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                {downloading === "docx" ? "Preparing…" : "Download Word (.docx)"}
              </Button>
              <Button onClick={handlePdf} disabled={downloading !== null} size="lg" variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                {downloading === "pdf" ? "Preparing…" : "Download PDF"}
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-1">
                No signup. No email. No watermark.
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold mb-2">What's included</h2>
              <ul className="space-y-1.5 text-sm">
                {template.sections.map((id) => (
                  <li key={id} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <span>{SECTIONS.find((s) => s.id === id)!.title}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-brand-green/10 to-transparent border-brand-green/30">
              <h2 className="font-semibold mb-1">Tired of writing RFPs?</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Let AI draft the full response from the actual RFP — free for your first 6 projects.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link to="/auth">Try OptiRFP.ai <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </Card>
          </aside>
        </div>

        {/* How to use */}
        <section className="mb-12 max-w-3xl">
          <h2 className="text-2xl font-semibold mb-4">How to use this template</h2>
          <div className="text-muted-foreground space-y-3 leading-relaxed">
            <p>Download the Word version, replace the cover page with your company branding, and update the solicitation number, RFP title and submission date. Every section ships with both guidance (italicized notes for your writers) and a placeholder paragraph you can edit in place.</p>
            <p>Map every shall/must/will requirement from the real RFP to a section in your response. If your bid is for a US federal agency, add a compliance matrix appendix that cross-references each requirement to the page/section where you address it — that single appendix is the most reliable lever for evaluator scoring.</p>
            <p>Have a peer reviewer read the response for compliance, clarity and pricing math before you finalize. Most win/loss debriefs cite a small number of preventable issues — wrong page numbers, mismatched assumptions, unfilled placeholders — that a fresh pair of eyes catches in 30 minutes.</p>
            <p>For teams responding to multiple RFPs per month, this template is the manual starting point. <Link to="/auth" className="text-brand-green underline">OptiRFP.ai</Link> automates the rest — extracting requirements, drafting compliant responses and tracking every shall statement automatically.</p>
          </div>
        </section>

        {/* CTA banner */}
        <Card className="p-6 mb-12 bg-gradient-to-r from-brand-green/15 to-transparent border-brand-green/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Need to respond to RFPs faster?</h3>
            <p className="text-sm text-muted-foreground">Try OptiRFP.ai — AI-drafted, compliance-checked, ready to submit.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </Card>

        {/* Related */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Related templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.slug} to={`/tools/rfp-template-library/${r.slug}`} className="block">
                <Card className="p-5 h-full hover:border-brand-green/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-brand-green" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {r.industryLabel}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 leading-tight">{r.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
