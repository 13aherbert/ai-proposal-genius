import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

function subtractBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const MILESTONES = [
  { name: "Bid/no-bid decision & kickoff", offset: 0 },
  { name: "Outline & compliance matrix complete", offset: 0.2 },
  { name: "First draft complete", offset: 0.5 },
  { name: "Internal review (red team)", offset: 0.75 },
  { name: "Final edits & production", offset: 0.9 },
  { name: "Submit to buyer", offset: 1 },
];

export default function DeadlineCalculator() {
  const tool = getTool("rfp-deadline-calculator")!;
  const [deadline, setDeadline] = useState("");
  const [leadDays, setLeadDays] = useState(20);

  const schedule = useMemo(() => {
    if (!deadline) return null;
    const submit = new Date(deadline + "T17:00:00");
    if (isNaN(submit.getTime())) return null;
    return MILESTONES.map((m) => {
      const daysBefore = Math.round(leadDays * (1 - m.offset));
      const date = subtractBusinessDays(submit, daysBefore);
      return { ...m, date, daysBefore };
    });
  }, [deadline, leadDays]);

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Pick the RFP submission deadline.",
        "Set how many business days you want for the full response cycle.",
        "Get a back-planned schedule of every milestone, weekends excluded.",
      ]}
      whyItMatters={
        <>
          <p>
            Most lost bids aren't lost on quality — they're lost on time. Teams discover the page-count cap, the past-performance form or the SAM.gov registration gap with 48 hours to go.
          </p>
          <p>
            Working backwards from the deadline forces you to confront the real schedule on day one, so you can resource the proposal properly or pass and free your team for a stronger bid.
          </p>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="deadline">Submission deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lead">Total business days for response</Label>
          <Input
            id="lead"
            type="number"
            min={3}
            max={120}
            value={leadDays}
            onChange={(e) => setLeadDays(Number(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
      </div>

      {schedule ? (
        <div className="space-y-3">
          {schedule.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-4">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">
                  {m.daysBefore === 0 ? "Submission day" : `${m.daysBefore} business days before deadline`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatDate(m.date)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Pick a deadline above to generate your schedule.</p>
      )}
    </ToolPageLayout>
  );
}
