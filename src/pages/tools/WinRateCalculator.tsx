import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

const BENCHMARKS = [
  { label: "Government services", value: 30 },
  { label: "Professional services", value: 35 },
  { label: "SaaS / technology", value: 40 },
  { label: "Construction / AEC", value: 25 },
];

export default function WinRateCalculator() {
  const tool = getTool("win-rate-calculator")!;
  const [submitted, setSubmitted] = useState(40);
  const [won, setWon] = useState(12);
  const [acv, setAcv] = useState(75000);

  const result = useMemo(() => {
    const rate = submitted > 0 ? (won / submitted) * 100 : 0;
    const revenue = won * acv;
    return { rate, revenue };
  }, [submitted, won, acv]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Enter the number of proposals you submitted in the period.",
        "Enter the number you won and your average contract value.",
        "Compare your win rate against industry benchmarks.",
      ]}
      whyItMatters={
        <>
          <p>
            Win rate is the single number that exposes whether your proposal team is busy or productive. A team submitting 100 bids at 10% wins less revenue — and burns more goodwill — than a team submitting 30 bids at 40%.
          </p>
          <p>
            Tracking it monthly turns bid/no-bid into a data conversation. Pair this calculator with a written go/no-go scorecard and most teams lift their win rate 5–15 points within two quarters.
          </p>
        </>
      }
    >
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="submitted">Proposals submitted</Label>
          <Input id="submitted" type="number" min={0} value={submitted}
            onChange={(e) => setSubmitted(Number(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="won">Proposals won</Label>
          <Input id="won" type="number" min={0} value={won}
            onChange={(e) => setWon(Number(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="acv">Avg contract value ($)</Label>
          <Input id="acv" type="number" min={0} value={acv}
            onChange={(e) => setAcv(Number(e.target.value) || 0)} className="mt-1" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm text-muted-foreground">Your win rate</div>
          <div className="text-4xl font-bold mt-1 text-brand-green">{result.rate.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm text-muted-foreground">Projected revenue from wins</div>
          <div className="text-4xl font-bold mt-1">${result.revenue.toLocaleString()}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Industry benchmarks
        </h3>
        <div className="space-y-2">
          {BENCHMARKS.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-44 text-sm">{b.label}</div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground/40" style={{ width: `${b.value * 2}%` }} />
              </div>
              <div className="w-12 text-right text-sm font-medium">{b.value}%</div>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t mt-3">
            <div className="w-44 text-sm font-semibold">You</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-brand-green" style={{ width: `${Math.min(result.rate * 2, 100)}%` }} />
            </div>
            <div className="w-12 text-right text-sm font-semibold">{result.rate.toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
