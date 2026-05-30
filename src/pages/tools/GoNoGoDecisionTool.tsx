import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, RotateCcw, Share2, Printer, Mail, CheckCircle2, AlertTriangle, XCircle, Clock, Users, DollarSign, Trophy, CalendarClock } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { getTool } from "@/data/tools-registry";

type Answer = "yes" | "maybe" | "no";

interface Question {
  id: string;
  label: string;
  category: string;
  icon: typeof Clock;
  question: string;
  help: string;
}

const QUESTIONS: Question[] = [
  {
    id: "past_performance",
    label: "Past Performance",
    category: "Past Performance",
    icon: Trophy,
    question: "Do you have relevant past performance that matches the RFP requirements?",
    help: "The buyer wants to see you've done similar work. Check Section L or Past Performance requirements.",
  },
  {
    id: "timeline",
    label: "Timeline",
    category: "Timeline",
    icon: CalendarClock,
    question: "Is the proposed timeline realistic for your team?",
    help: "Consider your current workload, team availability, and project complexity.",
  },
  {
    id: "relationship",
    label: "Relationships",
    category: "Relationships",
    icon: Users,
    question: "Do you know the buyer or have a relationship with the decision-makers?",
    help: "Relationships matter. Have you met the procurement team or end users?",
  },
  {
    id: "budget",
    label: "Budget",
    category: "Budget",
    icon: DollarSign,
    question: "Is the budget range profitable and aligned with your pricing?",
    help: "Check the independent government cost estimate (IGCE) or budget section.",
  },
  {
    id: "win_history",
    label: "Win History",
    category: "Win History",
    icon: Clock,
    question: "Have you won similar RFPs in the past 2 years?",
    help: "Past success in similar bids is a strong predictor of future wins.",
  },
];

const STORAGE_KEY = "go-no-go-decision-v1";
const POINTS: Record<Answer, number> = { yes: 20, maybe: 10, no: 0 };

function encodeAnswers(answers: Record<string, Answer>): string {
  return QUESTIONS.map((q) => {
    const a = answers[q.id];
    return a === "yes" ? "y" : a === "maybe" ? "m" : a === "no" ? "n" : "_";
  }).join("");
}

function decodeAnswers(code: string): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  QUESTIONS.forEach((q, i) => {
    const c = code[i];
    if (c === "y") out[q.id] = "yes";
    else if (c === "m") out[q.id] = "maybe";
    else if (c === "n") out[q.id] = "no";
  });
  return out;
}

type Verdict = "strong" | "conditional" | "weak";

function getVerdict(score: number): Verdict {
  if (score >= 80) return "strong";
  if (score >= 40) return "conditional";
  return "weak";
}

const VERDICT_CONFIG: Record<Verdict, {
  emoji: string;
  label: string;
  headline: string;
  summary: string;
  actions: string[];
  cta: string;
  ringClass: string;
  badgeClass: string;
}> = {
  strong: {
    emoji: "🟢",
    label: "STRONG BID — Go For It!",
    headline: "This RFP aligns well with your capabilities.",
    summary: "Your scores indicate a strong fit across the factors that drive wins. Move fast.",
    actions: [
      "Start building your response team immediately.",
      "Request any clarifications within 48 hours.",
      "Begin drafting your win themes and discriminators.",
    ],
    cta: "Start Your Response with OptiRFP.ai →",
    ringClass: "ring-emerald-500/40 bg-emerald-500/10 text-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  },
  conditional: {
    emoji: "🟡",
    label: "CONDITIONAL BID — Address Risks First",
    headline: "This RFP has potential but carries real risks.",
    summary: "You can win this — but only if you close the gaps shown in the breakdown below before kickoff.",
    actions: [
      "Address your lowest-scoring factor before committing resources.",
      "Consider partnering with a subcontractor to fill capability gaps.",
      "Request a debrief if you've lost to this buyer before.",
    ],
    cta: "See How AI Can Strengthen Your Weak Areas →",
    ringClass: "ring-amber-500/40 bg-amber-500/10 text-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  weak: {
    emoji: "🔴",
    label: "WEAK BID — Consider Passing",
    headline: "This RFP may not be worth your time and resources.",
    summary: "Industry data shows responding to unqualified RFPs costs $10,000–50,000 per bid. Protect your team.",
    actions: [
      "Focus on RFPs where you have stronger alignment.",
      "Use this as competitive intelligence for future opportunities.",
      "Send a courteous no-bid letter to preserve the buyer relationship.",
    ],
    cta: "Find Better RFP Opportunities with OptiRFP.ai →",
    ringClass: "ring-red-500/40 bg-red-500/10 text-red-500",
    badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
  },
};

function recommendationFor(answer: Answer, q: Question): string {
  if (answer === "yes") return `Strength — ${q.label.toLowerCase()} is a real advantage. Lead with it in your win themes.`;
  if (answer === "maybe") return `Risk — clarify your position on ${q.label.toLowerCase()} before the bid/no-bid meeting.`;
  return `Gap — without ${q.label.toLowerCase()}, you're starting behind. Mitigate or reconsider.`;
}

export default function GoNoGoDecisionTool() {
  const tool = getTool("rfp-go-no-go-decision-tool")!;
  const [searchParams, setSearchParams] = useSearchParams();

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [email, setEmail] = useState("");

  // Restore from URL or localStorage on mount
  useEffect(() => {
    const urlCode = searchParams.get("a");
    if (urlCode && urlCode.length === QUESTIONS.length) {
      const restored = decodeAnswers(urlCode);
      if (Object.keys(restored).length === QUESTIONS.length) {
        setAnswers(restored);
        setStarted(true);
        setStep(QUESTIONS.length); // jump to results
        return;
      }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers) setAnswers(parsed.answers);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, updatedAt: Date.now() }));
    } catch { /* ignore */ }
  }, [answers]);

  const isComplete = QUESTIONS.every((q) => answers[q.id]);
  const showResults = started && step >= QUESTIONS.length && isComplete;

  const { score, perCategory } = useMemo(() => {
    const per = QUESTIONS.map((q) => {
      const a = answers[q.id];
      const pts = a ? POINTS[a] : 0;
      return { q, answer: a, points: pts, percent: (pts / 20) * 100 };
    });
    const total = per.reduce((s, p) => s + p.points, 0);
    return { score: total, perCategory: per };
  }, [answers]);

  const verdict = getVerdict(score);
  const cfg = VERDICT_CONFIG[verdict];

  function handleAnswer(a: Answer) {
    const q = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.id]: a }));
    setDirection(1);
    setTimeout(() => setStep((s) => s + 1), 120);
  }

  function handlePrev() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function handleStart() {
    setStarted(true);
    setStep(0);
    setDirection(1);
  }

  function handleReset() {
    setAnswers({});
    setStep(0);
    setStarted(false);
    setSearchParams({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  function handleShare() {
    const code = encodeAnswers(answers);
    const url = `${window.location.origin}/tools/rfp-go-no-go-decision-tool?a=${code}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Shareable link copied to clipboard"),
      () => toast.error("Could not copy link"),
    );
  }

  function handleEmailResults(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    // Generate PDF and offer download as the "save my results" action.
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 56;
      let y = margin;
      doc.setFontSize(20);
      doc.text("RFP Go / No-Go Decision Report", margin, y); y += 28;
      doc.setFontSize(12);
      doc.setTextColor(110);
      doc.text(`Prepared for: ${email}`, margin, y); y += 16;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y); y += 28;
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text(`Recommendation: ${cfg.label}`, margin, y); y += 22;
      doc.setFontSize(12);
      doc.text(`Weighted score: ${score} / 100`, margin, y); y += 24;
      doc.setFontSize(13);
      doc.text("Factor breakdown", margin, y); y += 18;
      doc.setFontSize(11);
      perCategory.forEach((p) => {
        const line = `• ${p.q.label}: ${p.answer?.toUpperCase() ?? "—"} (${p.points}/20)`;
        doc.text(line, margin, y); y += 14;
        const rec = doc.splitTextToSize(recommendationFor(p.answer!, p.q), 480);
        doc.setTextColor(110);
        rec.forEach((l: string) => { doc.text(l, margin + 14, y); y += 14; });
        doc.setTextColor(0);
        y += 4;
      });
      y += 8;
      doc.setFontSize(13);
      doc.text("Recommended next actions", margin, y); y += 18;
      doc.setFontSize(11);
      cfg.actions.forEach((a) => {
        const lines = doc.splitTextToSize(`• ${a}`, 480);
        lines.forEach((l: string) => { doc.text(l, margin, y); y += 14; });
      });
      doc.save("rfp-go-no-go-report.pdf");
      toast.success("Report downloaded — check your downloads folder");
    } catch {
      toast.error("Could not generate report");
    }
  }

  const current = QUESTIONS[step];
  const progressPct = started
    ? showResults
      ? 100
      : (step / QUESTIONS.length) * 100
    : 0;

  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        "Answer 5 weighted questions about past performance, timeline, relationships, budget and win history.",
        "Each Yes = 20 pts, Not Sure = 10 pts, No = 0 pts — for a clear score out of 100.",
        "Get a Strong / Conditional / Weak verdict with factor-specific next actions you can share with your team.",
      ]}
      whyItMatters={
        <>
          <p>
            Bid discipline is the highest-leverage habit in proposals. Companies that use structured bid decisions <strong>win 40% more often</strong>, and responding to unqualified RFPs costs <strong>$10,000–$50,000 per bid</strong> in opportunity cost.
          </p>
          <p>
            This 60-second assessment turns gut-feel debate into a written, defensible call you can take into the pursuit-review meeting. Inside OptiRFP, the same scorecard sits on every opportunity and feeds your win-rate analytics.
          </p>
        </>
      }
    >
      <div className="space-y-6">
        {/* Progress */}
        {started && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {showResults ? "Results" : `Question ${Math.min(step + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
              </span>
              <span className="tabular-nums">{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {/* Hero / Start */}
        {!started && (
          <div className="text-center py-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Should You Bid on This RFP?</h2>
            <p className="text-muted-foreground mb-2">
              Answer 5 quick questions to get an objective bid/no-bid recommendation.
            </p>
            <p className="text-sm text-muted-foreground mb-6 inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Takes 60 seconds
            </p>
            <div>
              <Button size="lg" onClick={handleStart} className="min-w-[200px]">
                Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Based on industry best practices from 1,000+ RFP evaluations.
            </p>
          </div>
        )}

        {/* Quiz */}
        {started && !showResults && current && (
          <div className="grid md:grid-cols-[1fr_220px] gap-6">
            <div className="overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  initial={{ x: direction * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -40, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="mb-5">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
                      <current.icon className="h-3.5 w-3.5" /> {current.label}
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold leading-snug">{current.question}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{current.help}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleAnswer("yes")}
                      className={`h-auto py-4 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500 ${answers[current.id] === "yes" ? "bg-emerald-500/10 text-emerald-500 ring-2 ring-emerald-500/40" : ""}`}
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Yes
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleAnswer("maybe")}
                      className={`h-auto py-4 border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-500 ${answers[current.id] === "maybe" ? "bg-amber-500/10 text-amber-500 ring-2 ring-amber-500/40" : ""}`}
                    >
                      <AlertTriangle className="mr-2 h-5 w-5" /> Not Sure
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleAnswer("no")}
                      className={`h-auto py-4 border-red-500/40 hover:bg-red-500/10 hover:text-red-500 ${answers[current.id] === "no" ? "bg-red-500/10 text-red-500 ring-2 ring-red-500/40" : ""}`}
                    >
                      <XCircle className="mr-2 h-5 w-5" /> No
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <Button variant="ghost" onClick={handlePrev} disabled={step === 0}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    {isComplete && (
                      <Button variant="secondary" onClick={() => setStep(QUESTIONS.length)}>
                        View results <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Answer summary */}
            <aside className="hidden md:block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your answers</div>
              <ul className="space-y-2">
                {QUESTIONS.map((q, i) => {
                  const a = answers[q.id];
                  const isCurrent = i === step;
                  return (
                    <li
                      key={q.id}
                      className={`text-sm flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${isCurrent ? "border-primary/50" : "border-border"}`}
                    >
                      <span className="truncate">{q.label}</span>
                      {a ? (
                        <span className={`text-xs font-medium ${a === "yes" ? "text-emerald-500" : a === "maybe" ? "text-amber-500" : "text-red-500"}`}>
                          {a === "yes" ? "Yes" : a === "maybe" ? "?" : "No"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className={`rounded-xl ring-2 p-6 ${cfg.ringClass}`}>
              <div className="flex items-baseline justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-70">Recommendation</div>
                  <div className="text-2xl md:text-3xl font-bold mt-1">{cfg.emoji} {cfg.label}</div>
                  <p className="opacity-80 mt-2 max-w-xl">{cfg.headline}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider opacity-70">Score</div>
                  <div className="text-4xl font-bold tabular-nums">
                    {score}
                    <span className="text-base opacity-70"> / 100</span>
                  </div>
                </div>
              </div>

              {/* Score meter */}
              <div className="mt-5">
                <div className="h-3 rounded-full bg-background/40 overflow-hidden relative">
                  <div
                    className="h-full bg-current opacity-80 transition-all"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider mt-1 opacity-70">
                  <span>No-Go</span>
                  <span>Conditional</span>
                  <span>Strong Bid</span>
                </div>
              </div>
            </div>

            {/* Category scores */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Factor breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {perCategory.map((p) => {
                  const Icon = p.q.icon;
                  const color =
                    p.answer === "yes" ? "text-emerald-500" :
                    p.answer === "maybe" ? "text-amber-500" :
                    "text-red-500";
                  return (
                    <div key={p.q.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {p.q.label}
                        </div>
                        <div className={`text-sm font-semibold tabular-nums ${color}`}>
                          {p.points}/20
                        </div>
                      </div>
                      <Progress value={p.percent} className="h-1.5 mb-2" />
                      <p className="text-xs text-muted-foreground">{recommendationFor(p.answer!, p.q)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="border rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-1">Recommended next actions</h3>
              <p className="text-sm text-muted-foreground mb-3">{cfg.summary}</p>
              <ul className="space-y-2">
                {cfg.actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-green" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-5">
                <Link to="/auth">{cfg.cta}</Link>
              </Button>
            </div>

            {/* Save / share */}
            <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end print:hidden">
              <form onSubmit={handleEmailResults} className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs text-muted-foreground">
                  Save my results (download PDF report)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    <Mail className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
              </form>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Start over
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolPageLayout>
  );
}
