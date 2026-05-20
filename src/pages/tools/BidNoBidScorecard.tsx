import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

interface Criterion {
  id: string;
  label: string;
  help: string;
}

interface Category {
  key: string;
  label: string;
  weight: number; // 0–1
  criteria: Criterion[];
}

const CATEGORIES: Category[] = [
  {
    key: "fit",
    label: "Strategic Fit",
    weight: 0.3,
    criteria: [
      { id: "scope", label: "Scope alignment with our core offering", help: "Does the SOW match what we sell every day?" },
      { id: "customer", label: "Existing relationship with this customer", help: "Incumbent, prior contracts, warm intros" },
      { id: "domain", label: "Domain / mission familiarity", help: "Have we delivered in this agency or vertical before?" },
    ],
  },
  {
    key: "win",
    label: "Win Probability",
    weight: 0.3,
    criteria: [
      { id: "competition", label: "Competitive position vs likely bidders", help: "Few strong competitors = higher score" },
      { id: "incumbent", label: "Incumbent vulnerability / open competition", help: "Truly open = 5; locked-in incumbent = 1" },
      { id: "discriminators", label: "Genuine discriminators we can prove", help: "Differentiators that survive scrutiny" },
    ],
  },
  {
    key: "capacity",
    label: "Capacity & Resources",
    weight: 0.2,
    criteria: [
      { id: "team", label: "Proposal team capacity through submission", help: "Will the right people actually be free?" },
      { id: "delivery", label: "Delivery capacity if we win", help: "Can we staff and execute on day one?" },
      { id: "cash", label: "Cash flow / financing through ramp", help: "Reserves to cover the gap until first invoice" },
    ],
  },
  {
    key: "value",
    label: "Strategic Value",
    weight: 0.2,
    criteria: [
      { id: "revenue", label: "Contract value vs effort", help: "Ceiling, run-rate revenue and margin" },
      { id: "strategic", label: "Strategic value (logo, market entry, IP)", help: "Even at break-even, is it worth winning?" },
      { id: "renewability", label: "Renewability / follow-on potential", help: "Recompetes, IDIQ task orders, expansion" },
    ],
  },
];

const ALL_IDS = CATEGORIES.flatMap((c) => c.criteria.map((cr) => cr.id));

export default function BidNoBidScorecard() {
  const tool = getTool("bid-no-bid-scorecard")!;
  const [oppName, setOppName] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(ALL_IDS.map((id) => [id, 3]))
  );

  const { categoryScores, total } = useMemo(() => {
    const cs = CATEGORIES.map((cat) => {
      const avg = cat.criteria.reduce((s, c) => s + (scores[c.id] || 0), 0) / cat.criteria.length;
      const pct = (avg / 5) * 100;
      return { ...cat, avg, pct, weighted: pct * cat.weight };
    });
    const t = cs.reduce((s, c) => s + c.weighted, 0);
    return { categoryScores: cs, total: t };
  }, [scores]);

  const verdict =
    total >= 70 ? { label: "BID", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" } :
    total >= 50 ? { label: "CAUTION", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" } :
    { label: "NO-BID", color: "text-red-600", bg: "bg-red-50 border-red-200" };

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Score each of the 12 criteria 1 (weak) to 5 (strong) using the sliders.",
        "Categories are auto-weighted: Strategic Fit 30%, Win Probability 30%, Capacity 20%, Strategic Value 20%.",
        "Read the verdict — and print or screenshot for your pursuit-review meeting.",
      ]}
      whyItMatters={
        <>
          <p>
            Bid / no-bid discipline is the single highest-leverage improvement most proposal teams can make. Industry studies repeatedly show that teams who say "no" more often have win rates 2–3× higher than teams who chase everything.
          </p>
          <p>
            A structured scorecard turns gut-feel debates into a written, defensible call. Inside OptiRFP, the same scorecard sits on every opportunity, history is tracked, and you can review your hit rate against past scores.
          </p>
        </>
      }
    >
      <div className="space-y-6">
        <div className="print:block">
          <Label htmlFor="opp">Opportunity name</Label>
          <input
            id="opp"
            value={oppName}
            onChange={(e) => setOppName(e.target.value)}
            placeholder="e.g. DoD AI/ML BPA RFP — June 2026"
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{cat.label}</h3>
              <span className="text-xs text-muted-foreground">Weight {Math.round(cat.weight * 100)}%</span>
            </div>
            <div className="space-y-4">
              {cat.criteria.map((c) => (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_220px_40px] gap-3 items-center">
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.help}</div>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[scores[c.id]]}
                    onValueChange={(v) => setScores((s) => ({ ...s, [c.id]: v[0] }))}
                  />
                  <div className="text-sm font-mono text-right tabular-nums">{scores[c.id]} / 5</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={`border rounded-lg p-6 ${verdict.bg}`}>
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Weighted score</div>
              <div className="text-4xl font-bold tabular-nums">{total.toFixed(1)}<span className="text-lg text-muted-foreground"> / 100</span></div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Recommendation</div>
              <div className={`text-3xl font-bold ${verdict.color}`}>{verdict.label}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {categoryScores.map((c) => (
              <div key={c.key} className="bg-background/70 rounded p-3 border">
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="text-lg font-semibold tabular-nums">{c.pct.toFixed(0)}<span className="text-xs text-muted-foreground">%</span></div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground mt-4">
            ≥70 BID · 50–69 CAUTION (decide with senior leadership) · &lt;50 NO-BID
          </div>
        </div>

        <Button variant="outline" onClick={() => window.print()} className="w-full print:hidden">
          <Printer className="mr-2 h-4 w-4" /> Print scorecard
        </Button>
      </div>
    </ToolPageLayout>
  );
}
