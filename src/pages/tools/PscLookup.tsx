import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import pscData from "@/data/psc-codes.json";

interface PscEntry {
  code: string;
  name: string;
  description: string | null;
  category: string;
}

const DATA = pscData as PscEntry[];

export default function PscLookup() {
  const tool = getTool("psc-code-lookup")!;
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PscEntry | null>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DATA.slice(0, 60);
    return DATA.filter((e) => {
      if (e.code.toLowerCase().startsWith(term)) return true;
      if (e.name.toLowerCase().includes(term)) return true;
      if (e.description?.toLowerCase().includes(term)) return true;
      if (e.category.toLowerCase().includes(term)) return true;
      return false;
    }).slice(0, 200);
  }, [q]);

  const related = useMemo(() => {
    if (!selected) return [];
    return DATA.filter((e) => e.code !== selected.code && e.category === selected.category).slice(0, 8);
  }, [selected]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Type a PSC code (e.g. R425) or any keyword for what's being purchased.",
        "Filter through the active GSA Product and Service Codes list.",
        "Click any result to see its category and related codes.",
      ]}
      whyItMatters={
        <>
          <p>
            Federal agencies tag every contract action with a PSC code. If you're searching SAM.gov, FPDS, or USAspending, knowing the right PSC narrows millions of records down to opportunities you can actually win.
          </p>
          <p>
            This lookup includes {DATA.length.toLocaleString()} active codes from the GSA's official Product and Service Codes Manual.
          </p>
        </>
      }
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by code (e.g. D310) or keyword (e.g. cloud)…"
        aria-label="PSC code search"
        className="text-base"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
        <div className="lg:col-span-3 border rounded-lg max-h-[480px] overflow-auto">
          {results.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No matches. Try a broader keyword.</div>
          ) : (
            <ul className="divide-y">
              {results.map((e) => (
                <li key={e.code}>
                  <button
                    onClick={() => setSelected(e)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                      selected?.code === e.code ? "bg-muted" : ""
                    }`}
                  >
                    <span className="font-mono text-brand-green font-semibold w-16 flex-shrink-0">{e.code}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{e.name}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{e.category}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{e.code.length}-char</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="border rounded-lg p-5 bg-card sticky top-4">
              <div className="font-mono text-2xl font-bold text-brand-green">{selected.code}</div>
              <h3 className="text-lg font-semibold mt-1">{selected.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Category: {selected.category}</p>
              {selected.description && (
                <p className="text-sm mt-3 leading-relaxed">{selected.description}</p>
              )}

              {related.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Related in {selected.category}</div>
                  <ul className="space-y-1">
                    {related.map((r) => (
                      <li key={r.code}>
                        <button onClick={() => setSelected(r)} className="text-sm text-left hover:text-brand-green">
                          <span className="font-mono">{r.code}</span> — {r.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">
                Need to classify <em>your business</em> instead? Use our{" "}
                <a href="/tools/naics-code-lookup" className="underline text-brand-green">
                  NAICS Code Lookup
                </a>
                .
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-5 bg-muted/30 text-sm text-muted-foreground">
              Select a code to see its description, category, and related PSCs.
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
