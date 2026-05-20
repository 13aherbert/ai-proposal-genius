import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

interface Form {
  companyName: string;
  tagline: string;
  coreCompetencies: string;
  differentiators: string;
  pastPerformance: string;
  naics: string;
  psc: string;
  uei: string;
  cage: string;
  certifications: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

const empty: Form = {
  companyName: "",
  tagline: "",
  coreCompetencies: "",
  differentiators: "",
  pastPerformance: "",
  naics: "",
  psc: "",
  uei: "",
  cage: "",
  certifications: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
};

const linesOf = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export default function CapabilityStatementGenerator() {
  const tool = getTool("capability-statement-generator")!;
  const [f, setF] = useState<Form>(empty);

  const update = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const canPreview = f.companyName.trim().length > 0 && f.coreCompetencies.trim().length > 0;

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Fill in your company info, core competencies and SAM.gov identifiers — only the company name and core competencies are required.",
        "Watch the 1-page capability statement update live below the form.",
        "Click Print → Save as PDF to download a federal-ready, US-Letter sized PDF.",
      ]}
      whyItMatters={
        <>
          <p>
            A capability statement is the single most-requested document at federal industry days and the most common attachment to a cold-outreach email to a contracting officer. Most small businesses build one in Word, lose the formatting, and never update it.
          </p>
          <p>
            This tool gives you a clean, evaluator-friendly layout in minutes. Keep the result as your master 1-pager; inside OptiRFP, the full app pulls these same facts into every proposal automatically.
          </p>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Company</h3>
          <div>
            <Label htmlFor="cn">Company name *</Label>
            <Input id="cn" value={f.companyName} onChange={update("companyName")} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="tag">Tagline / one-liner</Label>
            <Input id="tag" value={f.tagline} onChange={update("tagline")} placeholder="What you do, for whom" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="cc">Core competencies * <span className="text-xs text-muted-foreground">(one per line)</span></Label>
            <Textarea id="cc" value={f.coreCompetencies} onChange={update("coreCompetencies")} className="mt-1.5 min-h-[120px]" placeholder={"Cybersecurity assessments\nCloud migration\nManaged IT services"} />
          </div>
          <div>
            <Label htmlFor="diff">Differentiators <span className="text-xs text-muted-foreground">(one per line)</span></Label>
            <Textarea id="diff" value={f.differentiators} onChange={update("differentiators")} className="mt-1.5 min-h-[100px]" placeholder={"FedRAMP-authorized\n10+ years federal experience"} />
          </div>
          <div>
            <Label htmlFor="pp">Past performance <span className="text-xs text-muted-foreground">(one per line: Agency — Contract — Value)</span></Label>
            <Textarea id="pp" value={f.pastPerformance} onChange={update("pastPerformance")} className="mt-1.5 min-h-[100px]" placeholder={"DoD — W91CRB-22-D-0001 — $4.2M\nUSDA — AG-3144-B-21-0009 — $1.8M"} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Classifications</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="naics">NAICS codes</Label>
              <Input id="naics" value={f.naics} onChange={update("naics")} placeholder="541512, 541519" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="psc">PSC codes</Label>
              <Input id="psc" value={f.psc} onChange={update("psc")} placeholder="D307, R425" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="uei">UEI</Label>
              <Input id="uei" value={f.uei} onChange={update("uei")} placeholder="ABC123DEF456" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="cage">CAGE</Label>
              <Input id="cage" value={f.cage} onChange={update("cage")} placeholder="1ABC2" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="cert">Certifications <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
            <Input id="cert" value={f.certifications} onChange={update("certifications")} placeholder="8(a), WOSB, HUBZone, SDVOSB" className="mt-1.5" />
          </div>

          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground pt-3">Contact</h3>
          <div>
            <Label htmlFor="con">Contact name</Label>
            <Input id="con" value={f.contactName} onChange={update("contactName")} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" value={f.contactEmail} onChange={update("contactEmail")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={f.contactPhone} onChange={update("contactPhone")} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="web">Website</Label>
            <Input id="web" value={f.website} onChange={update("website")} placeholder="example.com" className="mt-1.5" />
          </div>

          <Button onClick={() => window.print()} disabled={!canPreview} className="w-full mt-4" size="lg">
            <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {canPreview && (
        <div className="mt-8 print:mt-0">
          <p className="text-sm text-muted-foreground mb-2 print:hidden">Live preview (this section prints; the form above does not):</p>
          <div className="capstmt mx-auto bg-white text-black p-10 border shadow-sm print:shadow-none print:border-0 print:p-8" style={{ width: "8.5in", minHeight: "11in" }}>
            <header className="border-b-4 border-brand-green pb-3 mb-4">
              <h1 className="text-3xl font-bold tracking-tight">{f.companyName}</h1>
              {f.tagline && <p className="text-base text-gray-700 mt-1">{f.tagline}</p>}
            </header>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                {f.coreCompetencies && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-green border-b mb-2 pb-0.5">Core Competencies</h2>
                    <ul className="list-disc pl-5 space-y-0.5 text-sm">
                      {linesOf(f.coreCompetencies).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </section>
                )}
                {f.differentiators && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-green border-b mb-2 pb-0.5">Differentiators</h2>
                    <ul className="list-disc pl-5 space-y-0.5 text-sm">
                      {linesOf(f.differentiators).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </section>
                )}
                {f.pastPerformance && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-brand-green border-b mb-2 pb-0.5">Past Performance</h2>
                    <ul className="list-disc pl-5 space-y-0.5 text-sm">
                      {linesOf(f.pastPerformance).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="space-y-4 text-sm">
                {(f.naics || f.psc) && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-green border-b mb-1 pb-0.5">Codes</h2>
                    {f.naics && <p><strong>NAICS:</strong> {f.naics}</p>}
                    {f.psc && <p><strong>PSC:</strong> {f.psc}</p>}
                  </section>
                )}
                {(f.uei || f.cage) && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-green border-b mb-1 pb-0.5">SAM.gov</h2>
                    {f.uei && <p><strong>UEI:</strong> {f.uei}</p>}
                    {f.cage && <p><strong>CAGE:</strong> {f.cage}</p>}
                  </section>
                )}
                {f.certifications && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-green border-b mb-1 pb-0.5">Certifications</h2>
                    <p>{f.certifications}</p>
                  </section>
                )}
                {(f.contactName || f.contactEmail || f.contactPhone || f.website) && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-green border-b mb-1 pb-0.5">Contact</h2>
                    {f.contactName && <p>{f.contactName}</p>}
                    {f.contactEmail && <p>{f.contactEmail}</p>}
                    {f.contactPhone && <p>{f.contactPhone}</p>}
                    {f.website && <p>{f.website}</p>}
                  </section>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .capstmt, .capstmt * { visibility: visible; }
          .capstmt { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; }
          @page { size: Letter; margin: 0.5in; }
        }
      `}</style>
    </ToolPageLayout>
  );
}
