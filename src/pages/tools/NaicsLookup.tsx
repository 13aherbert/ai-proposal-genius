import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";
import naicsData from "@/data/naics-2022.json";

interface NaicsEntry {
  code: string;
  title: string;
  level: number;
  sector: string;
}

const DATA = naicsData as NaicsEntry[];

export default function NaicsLookup() {
  const tool = getTool("naics-code-lookup")!;
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<NaicsEntry | null>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DATA.filter((e) => e.level <= 3).slice(0, 50);
    const isDigits = /^\d+/.test(term);
    return DATA.filter((e) => {
      if (isDigits) return e.code.startsWith(term);
      return e.title.toLowerCase().includes(term) || e.sector.toLowerCase().includes(term);
    }).slice(0, 100);
  }, [q]);

  const related = useMemo(() => {
    if (!selected) return [];
    const prefix = selected.code.slice(0, Math.max(2, selected.code.length - 1));
    return DATA.filter((e) => e.code !== selected.code && e.code.startsWith(prefix) && e.level === selected.level).slice(0, 8);
  }, [selected]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Type a 2–6 digit NAICS code or any keyword describing your business.",
        "Browse matching industries from the official 2022 NAICS list.",
        "Click a result to see its full hierarchy, sector, and related codes.",
      ]}
      whyItMatters={
        <>
          <p>
            Picking the wrong NAICS code locks you out of bids you should be winning. Federal agencies use NAICS to set small business size standards — a single-digit slip can move you from "small" to "other than small" and disqualify you from set-aside opportunities.
          </p>
          <p>
            This lookup uses the full 2022 NAICS edition published by the US Census Bureau ({DATA.length.toLocaleString()} codes total). It's the same list SAM.gov, the SBA, and federal contracting officers reference.
          </p>
        </>
      }
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by code (e.g. 5415) or keyword (e.g. software)…"
        aria-label="NAICS code search"
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
                    <span className="flex-1">
                      <span className="block">{e.title}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{e.sector}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">{e.level}-digit</Badge>
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
              <h3 className="text-lg font-semibold mt-1">{selected.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Sector: {selected.sector}</p>
              <p className="text-sm mt-3">
                {selected.level === 6
                  ? "This is the most specific (6-digit) NAICS — use it as your primary code on SAM.gov."
                  : `This is a ${selected.level}-digit grouping. Drill into a 6-digit code for federal registration.`}
              </p>

              {related.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Related codes</div>
                  <ul className="space-y-1">
                    {related.map((r) => (
                      <li key={r.code}>
                        <button onClick={() => setSelected(r)} className="text-sm text-left hover:text-brand-green">
                          <span className="font-mono">{r.code}</span> — {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">
                Looking for state/local equivalents? Many states use{" "}
                <a href="https://www.nigp.org" target="_blank" rel="noopener noreferrer" className="underline">
                  NIGP codes
                </a>
                . For federal contract product/service classification, use our{" "}
                <a href="/tools/psc-code-lookup" className="underline text-brand-green">
                  PSC Code Lookup
                </a>
                .
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-5 bg-muted/30 text-sm text-muted-foreground">
              Select a code to see its full sector hierarchy and related industry codes.
            </div>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
