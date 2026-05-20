import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import data from "@/data/govcon-acronyms.json";

interface Entry { term: string; definition: string; }
const ALL: Entry[] = (data.acronyms as Entry[]).slice().sort((a, b) => a.term.localeCompare(b.term));
const MAP = new Map<string, string>(ALL.map((e) => [e.term.toUpperCase(), e.definition]));

const ACRONYM_RE = /\b[A-Z][A-Z0-9&/]{1,6}\b/g;

export default function GovConAcronymDecoder() {
  const tool = getTool("govcon-acronym-decoder")!;
  const [q, setQ] = useState("");
  const [rfp, setRfp] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL;
    return ALL.filter((e) => e.term.toLowerCase().includes(s) || e.definition.toLowerCase().includes(s));
  }, [q]);

  const { highlighted, found } = useMemo(() => {
    if (!rfp.trim()) return { highlighted: null as null | (string | { term: string; def: string })[], found: [] as Entry[] };
    const parts: (string | { term: string; def: string })[] = [];
    const seen = new Set<string>();
    let last = 0;
    rfp.replace(ACRONYM_RE, (m, offset: number) => {
      const def = MAP.get(m.toUpperCase());
      if (!def) return m;
      if (offset > last) parts.push(rfp.slice(last, offset));
      parts.push({ term: m, def });
      seen.add(m.toUpperCase());
      last = offset + m.length;
      return m;
    });
    if (last < rfp.length) parts.push(rfp.slice(last));
    const foundList = ALL.filter((e) => seen.has(e.term.toUpperCase()));
    return { highlighted: parts, found: foundList };
  }, [rfp]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Use the Browse tab to search the full dictionary of 500+ acronyms by code or keyword.",
        "Use the Decode RFP tab to paste any RFP text and have every known acronym highlighted inline.",
        "Hover any highlighted acronym to see its full definition.",
      ]}
      whyItMatters={
        <>
          <p>
            Federal RFPs are dense with acronyms — a typical Section L runs 30+ unique abbreviations across FAR, agency-specific and program-specific terms. Misreading one (CDRL vs CLIN, IDIQ vs IDV) costs evaluator points and, in worst cases, compliance.
          </p>
          <p>
            This decoder gives every team member instant context. Inside OptiRFP, the same dictionary auto-expands acronyms while writers draft, and your organisation can layer on private agency-specific glossaries.
          </p>
        </>
      }
    >
      <Tabs defaultValue="browse">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="browse">Browse dictionary</TabsTrigger>
          <TabsTrigger value="decode">Decode RFP text</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by acronym or keyword (e.g. CDRL, contract, security)" className="pl-9" />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length.toLocaleString()} of {ALL.length} acronyms</div>
          <div className="border rounded-lg max-h-[480px] overflow-auto divide-y">
            {filtered.map((e) => (
              <div key={e.term} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2.5 text-sm">
                <span className="font-mono font-semibold">{e.term}</span>
                <span className="text-muted-foreground">{e.definition}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">No acronym matched. Try a different keyword.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="decode" className="mt-4 space-y-3">
          <div>
            <Label htmlFor="rfp">Paste RFP text</Label>
            <Textarea
              id="rfp"
              value={rfp}
              onChange={(e) => setRfp(e.target.value)}
              placeholder="Paste any RFP, SOW or solicitation text — every recognised acronym will be highlighted below."
              className="min-h-[200px] mt-1.5"
            />
          </div>
          {highlighted && (
            <>
              <div className="border rounded-lg p-4 bg-card whitespace-pre-wrap leading-relaxed text-sm">
                {highlighted.map((p, i) =>
                  typeof p === "string" ? (
                    <span key={i}>{p}</span>
                  ) : (
                    <span
                      key={i}
                      title={p.def}
                      className="bg-brand-green/15 text-brand-green rounded px-1 cursor-help font-medium"
                    >
                      {p.term}
                    </span>
                  )
                )}
              </div>
              <div className="text-xs text-muted-foreground">{found.length} acronyms recognised</div>
              {found.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {found.map((e) => (
                    <div key={e.term} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2 text-sm">
                      <span className="font-mono font-semibold">{e.term}</span>
                      <span className="text-muted-foreground">{e.definition}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </ToolPageLayout>
  );
}
