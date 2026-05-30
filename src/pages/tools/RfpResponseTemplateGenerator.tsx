import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import { toast } from "sonner";
import { FileDown, FileText } from "lucide-react";
import {
  INDUSTRIES, SECTIONS, DEFAULT_SECTIONS, sectionBody, industryName,
  downloadDocx, downloadPdf, type IndustryId, type SectionId,
} from "@/lib/rfp-template-builder";

const STORAGE_KEY = "rfp-template-gen-v1";



// ---------- Component ----------
export default function RfpResponseTemplateGenerator() {
  const tool = getTool("rfp-response-template-generator")!;
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<IndustryId | null>(null);
  const [selected, setSelected] = useState<SectionId[]>(DEFAULT_SECTIONS);

  // Load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.companyName) setCompanyName(s.companyName);
        if (s.industry) setIndustry(s.industry);
        if (Array.isArray(s.selected) && s.selected.length) setSelected(s.selected);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ companyName, industry, selected })); } catch { /* noop */ }
  }, [companyName, industry, selected]);

  const toggle = (id: SectionId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = selected.length === SECTIONS.length;
  const orderedSelected = useMemo(
    () => SECTIONS.map((s) => s.id).filter((id) => selected.includes(id)) as SectionId[],
    [selected],
  );

  const canDownload = orderedSelected.length > 0;

  const baseFilename = (companyName || "RFP-Response").replace(/[^a-z0-9]+/gi, "-");

  const handleDocx = async () => {
    if (!canDownload) return;
    await downloadDocx(companyName, industry, orderedSelected, `${baseFilename}-Template.docx`);
    toast.success("Word template downloaded");
  };

  const handlePdf = () => {
    if (!canDownload) return;
    downloadPdf(companyName, industry, orderedSelected, `${baseFilename}-Template.pdf`);
    toast.success("PDF template downloaded");
  };


  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Pick the industry that best matches your RFP — language and guidance adapt automatically.",
        "Check the sections you need. Defaults cover the most-evaluated areas; add risk, QA or compliance as needed.",
        "Preview the assembled template, then download as Word (.docx) or PDF. Edit in your tool of choice.",
      ]}
      whyItMatters={
        <>
          <p>
            Most teams start every RFP response from scratch or from a stale template buried in SharePoint. That costs two days of structural work before a single requirement is addressed — and the response usually reads generic.
          </p>
          <p>
            This generator gives you a defensible, evaluator-friendly skeleton in 30 seconds, with industry-specific framing baked into every section. Use it as your starting draft; let OptiRFP.ai write the full response when you're ready to scale.
          </p>
        </>
      }
    >
      {/* Step 1: Company + Industry */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-6 w-6 rounded-full bg-brand-green text-white text-xs font-semibold flex items-center justify-center">1</span>
          <h3 className="font-semibold">Company & industry</h3>
        </div>
        <div className="mb-4 max-w-md">
          <Label htmlFor="company">Company name <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon;
            const active = industry === ind.id;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => setIndustry(ind.id)}
                className={`text-left rounded-lg border p-3 transition-all hover:border-brand-green/60 ${
                  active ? "border-brand-green bg-brand-green/5 ring-2 ring-brand-green/30" : "border-border"
                }`}
                aria-pressed={active}
              >
                <Icon className={`h-5 w-5 mb-2 ${active ? "text-brand-green" : "text-muted-foreground"}`} />
                <div className="text-sm font-medium leading-tight">{ind.name}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{ind.blurb}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: Sections */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-brand-green text-white text-xs font-semibold flex items-center justify-center">2</span>
            <h3 className="font-semibold">Sections to include</h3>
            <span className="text-xs text-muted-foreground">({selected.length}/{SECTIONS.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(allSelected ? [] : SECTIONS.map((s) => s.id) as SectionId[])}
          >
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECTIONS.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
                aria-label={s.title}
              />
              <span className="text-sm">{s.title}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Step 3: Preview + Download */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="h-6 w-6 rounded-full bg-brand-green text-white text-xs font-semibold flex items-center justify-center">3</span>
          <h3 className="font-semibold">Preview & download</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Button onClick={handleDocx} disabled={!canDownload} size="lg">
            <FileDown className="mr-2 h-4 w-4" /> Download Word (.docx)
          </Button>
          <Button onClick={handlePdf} disabled={!canDownload} size="lg" variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>

        {canDownload ? (
          <Card className="p-6 bg-white text-black border max-h-[500px] overflow-auto">
            <div className="text-center pb-4 border-b mb-4">
              <h2 className="text-2xl font-bold">{companyName || "[Your Company Name]"}</h2>
              <p className="text-sm" style={{ color: "#1E40AF" }}>RFP Response</p>
              <p className="text-xs text-gray-500 mt-1">
                Industry: {industry ? INDUSTRIES.find((i) => i.id === industry)!.name : "All industries"}
              </p>
            </div>
            <h3 className="font-semibold text-sm mb-2">Table of Contents</h3>
            <ol className="text-sm space-y-1 mb-6 list-decimal pl-5">
              {orderedSelected.map((id) => (
                <li key={id}>{SECTIONS.find((s) => s.id === id)!.title}</li>
              ))}
            </ol>
            {orderedSelected.map((id, i) => {
              const meta = SECTIONS.find((s) => s.id === id)!;
              const body = sectionBody(id, industry);
              return (
                <div key={id} className="mb-5">
                  <h3 className="font-semibold text-base" style={{ color: "#1E40AF" }}>
                    {i + 1}. {meta.title}
                  </h3>
                  <p className="italic text-xs text-gray-500 mt-1 mb-1">Guidance: {body.guidance}</p>
                  <p className="text-sm leading-relaxed">{body.placeholder}</p>
                </div>
              );
            })}
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">Select at least one section to see the preview.</p>
        )}
      </section>
    </ToolPageLayout>
  );
}
