import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import {
  ArrowRight, CheckCircle2, Clock, Download, Lightbulb, AlertTriangle,
  FileText, Users, ListChecks, Send, Sparkles, BookOpen,
} from "lucide-react";

const SITE = "https://optirfp.ai";
const PATH = "/tools/how-to-respond-to-an-rfp";
const STORAGE_KEY = "how-to-respond-rfp-v1";

// ============ Step data ============
type StepId = "understand" | "go-no-go" | "team" | "draft" | "review" | "submit";

const STEPS: { id: StepId; n: number; title: string; time: string; icon: typeof FileText }[] = [
  { id: "understand", n: 1, title: "Understand the RFP", time: "2–3 hours", icon: BookOpen },
  { id: "go-no-go", n: 2, title: "Go / No-Go Decision", time: "1 hour", icon: ListChecks },
  { id: "team", n: 3, title: "Build Your Response Team", time: "30 min", icon: Users },
  { id: "draft", n: 4, title: "Draft Each Section", time: "20–60 hours", icon: FileText },
  { id: "review", n: 5, title: "Review & Polish", time: "4–8 hours", icon: CheckCircle2 },
  { id: "submit", n: 6, title: "Submit & Follow Up", time: "1–2 hours", icon: Send },
];

const STEP1_CHECKLIST = [
  "Read the entire RFP twice",
  "Highlight all mandatory ('shall/must/will') requirements",
  "Note submission deadline, format and delivery method",
  "Identify evaluation criteria and their weighting",
  "Check for amendments, Q&A or addenda",
  "Submit clarifying questions before the deadline",
];

const STEP5_CHECKLIST = [
  "All mandatory requirements addressed (compliance matrix complete)",
  "Page, font, margin and spacing limits respected",
  "All forms, certifications and reps & certs completed and signed",
  "Pricing is clear, totalled and matches the required format",
  "No typos — proofread by someone outside the writing team",
  "Graphics are clear, labelled and referenced in the text",
  "Table of contents matches the final section order and page numbers",
  "File names follow the RFP's required naming convention",
];

const GO_NO_GO_QUESTIONS = [
  "Do you have relevant past performance for this scope?",
  "Is the timeline realistic for your team's current capacity?",
  "Do you have a relationship with the buyer or key decision-makers?",
  "Is the budget range profitable at your normal margins?",
  "Have you won similar RFPs in the last 24 months?",
];

const FAQS = [
  { q: "How long does it take to respond to an RFP?", a: "A typical mid-size RFP response takes 40–80 hours of total team effort over 2–4 weeks. Complex federal proposals can run 200+ hours. Our time calculator below gives a tailored estimate based on page count, sections and team size." },
  { q: "What makes a winning RFP response?", a: "Three things: full compliance with every mandatory requirement, a clear win theme tied to the buyer's stated evaluation criteria, and credible proof (case studies, references, named team members). Style and design matter, but compliance and proof drive scoring." },
  { q: "Should I always respond to every RFP I receive?", a: "No. Disciplined bid / no-bid is the single biggest lever on win rate. If you can't answer 'yes' to at least 3 of the 5 questions in our Go/No-Go tool, your time is better spent on opportunities you can actually win." },
  { q: "How is an RFP different from an RFQ or RFI?", a: "An RFI (Request for Information) gathers market data — no commitment. An RFQ (Request for Quote) is price-driven on a defined product or service. An RFP (Request for Proposal) is a structured competitive process where price is one of several scored criteria." },
  { q: "Can AI write my RFP response?", a: "AI can write a strong first draft, extract requirements into a compliance matrix and re-use approved content from past wins — which is exactly what OptiRFP.ai does. Humans still need to validate facts, set strategy and finalise pricing." },
];

const RESOURCES = [
  { title: "RFP Response Checklist (PDF)", description: "The full 60-item checklist used by professional capture managers.", href: "/tools/rfp-response-template-generator" },
  { title: "RFP Timeline Template", description: "Back-planned schedule from kickoff to submission.", href: "/tools/rfp-deadline-calculator" },
  { title: "RFP Compliance Matrix", description: "Auto-extract every shall/must/will requirement from any RFP.", href: "/tools/compliance-matrix-generator" },
  { title: "GovCon Acronym Glossary", description: "500+ federal acquisition acronyms, decoded.", href: "/tools/govcon-acronym-decoder" },
];

// ============ Helpers ============
function useChecklist(key: string, items: string[]) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === items.length) setChecked(parsed);
      }
    } catch { /* noop */ }
  }, [key, items.length]);
  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_KEY}:${key}`, JSON.stringify(checked)); } catch { /* noop */ }
  }, [key, checked]);
  const toggle = (i: number) => setChecked((p) => p.map((v, idx) => (idx === i ? !v : v)));
  const completed = checked.filter(Boolean).length;
  return { checked, toggle, completed };
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-4 flex gap-3">
      <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm"><strong className="text-amber-600 dark:text-amber-400">Pro tip — </strong>{children}</div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-lg border-l-4 border-destructive bg-destructive/5 p-4 flex gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="text-sm"><strong className="text-destructive">Common mistake — </strong>{children}</div>
    </div>
  );
}

function ChecklistBlock({ items, storageKey }: { items: string[]; storageKey: string }) {
  const { checked, toggle, completed } = useChecklist(storageKey, items);
  return (
    <Card className="p-5 mt-4 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2"><ListChecks className="h-4 w-4" /> Checklist</h4>
        <span className="text-sm text-muted-foreground">{completed} of {items.length} completed</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer group">
            <Checkbox checked={checked[i]} onCheckedChange={() => toggle(i)} className="mt-0.5" />
            <span className={`text-sm ${checked[i] ? "line-through text-muted-foreground" : ""}`}>{item}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(completed / items.length) * 100}%` }} />
      </div>
    </Card>
  );
}

function SoftCTA({ label = "Want AI to handle this step?" }: { label?: string }) {
  return (
    <Link to="/demo" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline">
      {label} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

// ============ Go/No-Go tool ============
function GoNoGoTool() {
  const [answers, setAnswers] = useState<("yes" | "no" | "unsure" | null)[]>(GO_NO_GO_QUESTIONS.map(() => null));
  const yes = answers.filter((a) => a === "yes").length;
  const answered = answers.filter(Boolean).length;
  const result = useMemo(() => {
    if (answered < GO_NO_GO_QUESTIONS.length) return null;
    if (yes >= 4) return { tone: "emerald", label: "Strong Bid — Go for it", body: "You have the foundations to win. Move to team kickoff and start the compliance matrix today." };
    if (yes >= 2) return { tone: "amber", label: "Conditional Bid — Address weaknesses first", body: "You can win, but only if you close the gaps. Look at each 'No' — can you bring a teaming partner, adjust scope or get a meeting with the buyer in the next 5 days?" };
    return { tone: "rose", label: "Weak Bid — Consider passing", body: "Spending 40+ hours on a low-probability bid means saying no to opportunities you could win. Pass, write a thank-you note, and stay in touch for the next cycle." };
  }, [answered, yes]);

  return (
    <Card className="p-6 mt-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Go/No-Go Decision Tool</h4>
      <div className="space-y-4">
        {GO_NO_GO_QUESTIONS.map((q, i) => (
          <div key={i} className="border-b border-border pb-3 last:border-0">
            <p className="text-sm mb-2 font-medium">{i + 1}. {q}</p>
            <div className="flex gap-2">
              {(["yes", "no", "unsure"] as const).map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={answers[i] === opt ? "default" : "outline"}
                  onClick={() => setAnswers((p) => p.map((v, idx) => (idx === i ? opt : v)))}
                  className="capitalize"
                >
                  {opt === "unsure" ? "Not sure" : opt}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-lg p-4 border-l-4 ${
            result.tone === "emerald" ? "border-emerald-500 bg-emerald-500/5" :
            result.tone === "amber" ? "border-amber-500 bg-amber-500/5" :
            "border-rose-500 bg-rose-500/5"
          }`}
        >
          <p className="font-semibold mb-1">{result.label}</p>
          <p className="text-sm text-muted-foreground">{result.body}</p>
          <p className="text-xs mt-2 text-muted-foreground">Score: {yes} of {GO_NO_GO_QUESTIONS.length} Yes responses</p>
        </motion.div>
      )}
    </Card>
  );
}

// ============ Timeline planner ============
function addBusinessDays(date: Date, days: number) {
  const d = new Date(date);
  let added = 0;
  while (added < Math.abs(days)) {
    d.setDate(d.getDate() + (days > 0 ? 1 : -1));
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return d;
}
function fmt(d: Date) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }

function TimelinePlanner() {
  const [due, setDue] = useState("");
  const dueDate = due ? new Date(due) : null;
  const milestones = useMemo(() => {
    if (!dueDate || isNaN(dueDate.getTime())) return null;
    return [
      { name: "Kickoff & compliance matrix", date: addBusinessDays(dueDate, -15) },
      { name: "Outline & writing assignments", date: addBusinessDays(dueDate, -13) },
      { name: "First draft complete", date: addBusinessDays(dueDate, -7) },
      { name: "Internal review (pink/red team)", date: addBusinessDays(dueDate, -4) },
      { name: "Final edits & production", date: addBusinessDays(dueDate, -2) },
      { name: "Submit", date: dueDate },
    ];
  }, [dueDate]);

  return (
    <Card className="p-6 mt-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline planner</h4>
      <Label htmlFor="due">RFP due date</Label>
      <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1.5 max-w-xs" />
      {milestones && (
        <ol className="mt-5 space-y-2.5">
          {milestones.map((m, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
              <span className="flex-1">{m.name}</span>
              <span className="font-mono text-muted-foreground">{fmt(m.date)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ============ Time calculator ============
const SECTION_HOURS: Record<string, number> = {
  "Executive Summary": 4, "Technical Approach": 16, "Pricing": 8,
  "Past Performance": 6, "Team Qualifications": 4, "Compliance Matrix": 6,
  "Management Plan": 6, "Quality Plan": 4,
};
const EXP_MULTIPLIER = { beginner: 1.5, intermediate: 1, expert: 0.7 } as const;

function TimeCalculator() {
  const [pages, setPages] = useState(50);
  const [sections, setSections] = useState<string[]>(Object.keys(SECTION_HOURS).slice(0, 5));
  const [team, setTeam] = useState(3);
  const [exp, setExp] = useState<keyof typeof EXP_MULTIPLIER>("intermediate");

  const sectionHours = sections.reduce((sum, s) => sum + SECTION_HOURS[s], 0);
  const pageHours = pages * 0.4;
  const totalHours = Math.round((sectionHours + pageHours) * EXP_MULTIPLIER[exp]);
  const calendarDays = Math.ceil(totalHours / (team * 6));

  const toggleSec = (s: string) => setSections((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  return (
    <Card className="p-6 my-8">
      <h3 className="text-xl font-semibold mb-1">How long will your RFP response take?</h3>
      <p className="text-sm text-muted-foreground mb-5">A realistic estimate based on page count, sections, team size and experience.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="mb-2 block">Pages required: <span className="font-mono">{pages}</span></Label>
          <Slider value={[pages]} onValueChange={(v) => setPages(v[0])} min={10} max={200} step={5} />
        </div>
        <div>
          <Label className="mb-2 block">Team size: <span className="font-mono">{team}</span></Label>
          <Slider value={[team]} onValueChange={(v) => setTeam(v[0])} min={1} max={10} step={1} />
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block">Sections to include</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.keys(SECTION_HOURS).map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={sections.includes(s)} onCheckedChange={() => toggleSec(s)} />
                <span>{s} <span className="text-muted-foreground">({SECTION_HOURS[s]}h)</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block">Team experience</Label>
          <div className="flex gap-2">
            {(["beginner", "intermediate", "expert"] as const).map((e) => (
              <Button key={e} size="sm" variant={exp === e ? "default" : "outline"} onClick={() => setExp(e)} className="capitalize">{e}</Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated effort</p>
          <p className="text-3xl font-bold text-primary mt-1">{totalHours} hours</p>
        </div>
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended timeline</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{calendarDays} working days</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Assumes ~6 productive hours per person per day. Add buffer for executive review.</p>
    </Card>
  );
}

// ============ PDF download ============
function downloadGuidePdf() {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  let y = margin;
  const w = doc.internal.pageSize.getWidth() - margin * 2;

  const addText = (text: string, size: number, opts: { bold?: boolean; space?: number } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, w);
    lines.forEach((ln: string) => {
      if (y > 720) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y);
      y += size * 1.3;
    });
    y += opts.space ?? 6;
  };

  addText("How to Respond to an RFP", 22, { bold: true, space: 4 });
  addText("The Complete Guide (2026)", 14, { space: 14 });
  addText("By OptiRFP.ai Team  •  15 min read  •  optirfp.ai", 9, { space: 18 });

  STEPS.forEach((s) => {
    addText(`Step ${s.n}: ${s.title}`, 14, { bold: true });
    addText(`Estimated time: ${s.time}`, 9, { space: 8 });
    if (s.id === "understand") {
      addText("Read the RFP twice before writing anything. The first read is for understanding scope, evaluation criteria and deadlines. The second is to extract every mandatory requirement into a compliance matrix.", 10);
      STEP1_CHECKLIST.forEach((c) => addText(`• ${c}`, 10));
    } else if (s.id === "go-no-go") {
      addText("Score the opportunity across 5 dimensions: past performance, capacity, buyer relationship, profitability and similar wins. 4+ Yes = bid, 2–3 = conditional, 0–1 = pass.", 10);
    } else if (s.id === "team") {
      addText("Assign a Capture Manager (owns strategy), Proposal Manager (owns process), section writers (1 per major section), pricing lead, and a reviewer who has NOT written any content.", 10);
    } else if (s.id === "draft") {
      addText("Write to the evaluation criteria — not in the order of the RFP. Lead each section with a benefit statement, then prove it with facts, names and numbers. Executive Summary is written LAST.", 10);
    } else if (s.id === "review") {
      addText("Run a Pink Team (content + strategy) at 70%, a Red Team (compliance + scoring simulation) at 90%, and a Gold Team (executive sign-off) at 100%.", 10);
      STEP5_CHECKLIST.forEach((c) => addText(`• ${c}`, 10));
    } else {
      addText("Submit at least 24 hours before the deadline. Confirm receipt in writing. Schedule a debrief — win or lose. Capture lessons learned within 5 days.", 10);
    }
    y += 6;
  });

  doc.save("how-to-respond-to-an-rfp-guide.pdf");
}

// ============ Page ============
export default function HowToRespondToRfpGuide() {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeStep, setActiveStep] = useState<StepId>("understand");

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / Math.max(1, (h.scrollHeight - h.clientHeight));
      setScrollPct(Math.min(1, Math.max(0, pct)));
      for (const s of STEPS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 200) setActiveStep(s.id);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useSEO({
    title: "How to Respond to an RFP: Complete Guide (2026) | OptiRFP.ai",
    description: "Learn how to write winning RFP responses with our step-by-step guide. Includes checklists, timelines, templates, and best practices. Free resources included.",
    canonical: `${SITE}${PATH}`,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "HowTo",
          name: "How to Respond to an RFP",
          description: "Step-by-step process for writing a winning RFP response, from first read through submission and debrief.",
          totalTime: "PT40H",
          step: STEPS.map((s) => ({
            "@type": "HowToStep",
            position: s.n,
            name: s.title,
            url: `${SITE}${PATH}#${s.id}`,
          })),
        },
        {
          "@type": "Article",
          headline: "How to Respond to an RFP: The Complete Guide (2026)",
          author: { "@type": "Organization", name: "OptiRFP.ai" },
          publisher: { "@type": "Organization", name: "OptiRFP.ai" },
          datePublished: "2026-01-15",
          dateModified: "2026-01-15",
          mainEntityOfPage: `${SITE}${PATH}`,
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question", name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Free Tools", item: `${SITE}/tools` },
            { "@type": "ListItem", position: 3, name: "How to Respond to an RFP", item: `${SITE}${PATH}` },
          ],
        },
      ],
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${scrollPct * 100}%` }} />
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/tools" className="hover:text-foreground">Free Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">How to Respond to an RFP</span>
        </nav>

        {/* Hero */}
        <header className="mb-12 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600 mb-3">
            <BookOpen className="h-3.5 w-3.5" /> Interactive guide
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How to Respond to an RFP: The Complete Guide (2026)
          </h1>
          <p className="text-lg text-muted-foreground mb-5">
            A step-by-step guide to writing winning RFP responses. From first read to final submission.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> 15 min read</span>
            <span>By OptiRFP.ai Team</span>
            <span>Updated January 2026</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={downloadGuidePdf} className="gap-2">
              <Download className="h-4 w-4" /> Download PDF guide
            </Button>
            <Button variant="outline" asChild>
              <a href="#step-understand">Start reading <ArrowRight className="ml-1.5 h-4 w-4" /></a>
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[240px_1fr] gap-10">
          {/* TOC sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">Contents</p>
              <ol className="space-y-1.5 text-sm">
                {STEPS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`block py-1.5 px-3 rounded-md transition-colors ${
                        activeStep === s.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-mono text-xs mr-2">{s.n}.</span>{s.title}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="mt-5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${scrollPct * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{Math.round(scrollPct * 100)}% read</p>
            </div>
          </aside>

          {/* Body */}
          <main className="max-w-3xl">
            {/* Step 1 */}
            <section id="understand" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 1 · {STEPS[0].time}</p>
              <h2 className="text-3xl font-bold mb-4">Understand the RFP Requirements</h2>
              <p className="text-muted-foreground mb-3">
                Most losing proposals fail before a single word is written — the team didn't fully understand what the buyer asked for. The first read is for context: who is the buyer, what problem are they solving, and what does success look like for them?
              </p>
              <p className="text-muted-foreground mb-3">
                The second read is mechanical. Pull every <strong>shall, must, will</strong> and <strong>is required to</strong> sentence into a compliance matrix. These are non-negotiable evaluation gates — miss one and you're out, regardless of how good your narrative is.
              </p>
              <h3 className="text-lg font-semibold mt-6 mb-2">Key actions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Print the RFP. Read on paper with a highlighter — comprehension is measurably higher.</li>
                <li>Build a compliance matrix on read #2. Every requirement gets a row, an owner and a section number.</li>
                <li>Pull out Sections L (instructions) and M (evaluation) first — they tell you exactly what scores points.</li>
                <li>Submit clarifying questions during the official Q&A window. Never assume.</li>
              </ol>
              <Warning>Don't skip the amendments. Most federal RFPs receive 2–6 amendments after release — and evaluators score against the latest version.</Warning>
              <ProTip>Ask one team member to read the RFP cold and write a 1-page summary. If their summary matches what you think the RFP says, you understand it. If it doesn't, re-read.</ProTip>
              <ChecklistBlock items={STEP1_CHECKLIST} storageKey="step1" />
              <SoftCTA label="Want AI to extract requirements for you?" />
            </section>

            {/* Step 2 */}
            <section id="go-no-go" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 2 · {STEPS[1].time}</p>
              <h2 className="text-3xl font-bold mb-4">Should You Bid on This RFP?</h2>
              <p className="text-muted-foreground mb-3">
                Disciplined bid / no-bid is the single biggest lever on win rate. Top performers bid on roughly 25–35% of qualified opportunities and win 50%+ of what they pursue. Low performers bid on everything and win 10–15%.
              </p>
              <p className="text-muted-foreground mb-3">
                Use the five questions below as a fast gate. If you can't answer Yes to at least three, your team's time is almost always better spent elsewhere.
              </p>
              <GoNoGoTool />
              <ProTip>Track your no-bids. Teams that record <em>why</em> they passed get better at qualifying — and stop wasting capture cycles on the same poor-fit opportunities.</ProTip>
              <SoftCTA label="Run a deeper 12-criteria scorecard →" />
            </section>

            {/* Step 3 */}
            <section id="team" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 3 · {STEPS[2].time}</p>
              <h2 className="text-3xl font-bold mb-4">Assemble Your Response Team</h2>
              <p className="text-muted-foreground mb-4">
                Proposals fail on process more than content. A clear team with named owners, fixed milestones and one decision-maker beats a "we'll all pitch in" approach every time.
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr><th className="text-left p-3 font-semibold">Role</th><th className="text-left p-3 font-semibold">Responsibility</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-3 font-medium">Capture Manager</td><td className="p-3 text-muted-foreground">Owns win strategy, customer relationships, competitive positioning</td></tr>
                    <tr><td className="p-3 font-medium">Proposal Manager</td><td className="p-3 text-muted-foreground">Owns schedule, compliance matrix, reviews, production</td></tr>
                    <tr><td className="p-3 font-medium">Section Writers</td><td className="p-3 text-muted-foreground">One owner per major section — Technical, Management, Past Performance</td></tr>
                    <tr><td className="p-3 font-medium">Pricing Lead</td><td className="p-3 text-muted-foreground">Builds cost model, validates with finance, owns BOE narratives</td></tr>
                    <tr><td className="p-3 font-medium">Reviewer</td><td className="p-3 text-muted-foreground">Must not have written content — scores the proposal as evaluator would</td></tr>
                  </tbody>
                </table>
              </div>
              <TimelinePlanner />
              <SoftCTA label="Want auto-generated assignments and reminders?" />
            </section>

            {/* Step 4 */}
            <section id="draft" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 4 · {STEPS[3].time}</p>
              <h2 className="text-3xl font-bold mb-4">Drafting Your RFP Response</h2>
              <p className="text-muted-foreground mb-6">
                Write to the evaluation criteria, not in the order of the RFP. Lead each section with a benefit statement; prove it with named people, real numbers and verifiable references. The Executive Summary is written <em>last</em>, after the win themes have stabilised.
              </p>

              <div className="space-y-6">
                {[
                  { name: "Executive Summary", words: "400–800 words", good: "Opens with the buyer's #1 stated outcome, names the team lead, quotes one past-performance result.", bad: '"We are pleased to submit our proposal..." — wastes the most-read paragraph on filler.' },
                  { name: "Technical Approach", words: "30–50% of page count", good: "Mirrors the RFP's structure section-by-section. Uses diagrams. Calls out risks the buyer hasn't asked about — proves you've thought deeper.", bad: "Generic methodology. No specifics. Reads like it could be any vendor's proposal." },
                  { name: "Pricing", words: "Use exact required format", good: "Matches the buyer's pricing table exactly. Each line tied to a basis-of-estimate. Discounts are explicit.", bad: "Bundled pricing with no breakdown. Forces the evaluator to do math the buyer didn't ask for." },
                  { name: "Past Performance", words: "3–5 case studies", good: "Each case study: same size client, same scope, same outcome. Includes a reference name + phone.", bad: 'Generic logos page. "Trusted by 500+ clients" with no detail.' },
                  { name: "Team Qualifications", words: "1 page per key person", good: "Resumes tailored to RFP-required experience. Org chart shows who reports to whom. Named back-ups for key roles.", bad: "Full corporate bios. No mapping to the RFP's required qualifications." },
                ].map((sec) => (
                  <Card key={sec.name} className="p-5">
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className="font-semibold text-lg">{sec.name}</h3>
                      <span className="text-xs text-muted-foreground">{sec.words}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-500/5 p-3">
                        <p className="text-xs font-semibold text-emerald-600 mb-1">✓ Good</p>
                        <p className="text-muted-foreground">{sec.good}</p>
                      </div>
                      <div className="rounded-md border-l-4 border-rose-500 bg-rose-500/5 p-3">
                        <p className="text-xs font-semibold text-rose-600 mb-1">✗ Bad</p>
                        <p className="text-muted-foreground">{sec.bad}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-6 mt-8 bg-gradient-to-br from-primary/10 to-emerald-500/5 border-primary/20">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Tired of drafting from scratch?</h3>
                <p className="text-sm text-muted-foreground mb-4">OptiRFP.ai writes the first draft for you — every section, grounded in your past wins and the RFP's own requirements. Teams cut drafting time by 80%.</p>
                <Button asChild><Link to="/demo">See how it works <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              </Card>
            </section>

            {/* Step 5 */}
            <section id="review" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 5 · {STEPS[4].time}</p>
              <h2 className="text-3xl font-bold mb-4">Review, Edit, and Ensure Compliance</h2>
              <p className="text-muted-foreground mb-3">
                Run three reviews. <strong>Pink Team</strong> at 70% (content + win themes), <strong>Red Team</strong> at 90% (compliance, scored as an evaluator would), and <strong>Gold Team</strong> at 100% (executive sign-off). Skipping any of the three correlates with a 30–40% drop in win rate.
              </p>
              <Warning>Never have the writer also be the reviewer. They've read the section 50 times and can no longer see what's missing.</Warning>
              <ChecklistBlock items={STEP5_CHECKLIST} storageKey="step5" />
            </section>

            {/* Step 6 */}
            <section id="submit" className="scroll-mt-24 mb-16">
              <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">Step 6 · {STEPS[5].time}</p>
              <h2 className="text-3xl font-bold mb-4">Submit and Follow Up</h2>
              <p className="text-muted-foreground mb-3">
                Submit at least 24 hours before the deadline. Portal uploads fail at the worst moments — and "the system was down" is not an accepted excuse. Confirm receipt in writing.
              </p>
              <p className="text-muted-foreground mb-3">
                Whether you win or lose, request a debrief. Federal buyers are required to offer one; commercial buyers usually will too. Capture the feedback within 5 days, while it's fresh — it's the single most valuable input to your next bid.
              </p>
              <ProTip>Write the lessons-learned document while you still hate the proposal. The honest version disappears once everyone has moved on.</ProTip>
            </section>

            {/* Time calculator */}
            <TimeCalculator />

            {/* Resources */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-4">Free RFP response resources</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {RESOURCES.map((r) => (
                  <Link key={r.title} to={r.href} className="group">
                    <Card className="p-5 h-full hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Download className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{r.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Upgrade CTA */}
            <section className="mb-16">
              <Card className="p-8 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border-primary/30">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Skip the manual work — let AI handle your RFP response</h2>
                <p className="text-muted-foreground mb-6">The same six-step process, automated.</p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Manual process</p>
                    <ul className="space-y-1.5 text-sm">
                      <li>• 40+ hours per response</li>
                      <li>• Multiple painful draft cycles</li>
                      <li>• Manual compliance tracking</li>
                      <li>• Re-writing the same content</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-2">With OptiRFP.ai</p>
                    <ul className="space-y-1.5 text-sm">
                      <li>• ~2 hours to first draft</li>
                      <li>• AI-written sections grounded in your wins</li>
                      <li>• Auto-built compliance matrix</li>
                      <li>• Reusable knowledge base across bids</li>
                    </ul>
                  </div>
                </div>
                <Button asChild size="lg"><Link to="/demo">See how it works <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <blockquote className="mt-6 pt-6 border-t border-border text-sm italic text-muted-foreground">
                  "We cut our RFP response time by 80% and finally have evenings back." — Capture lead, mid-size GovCon firm
                </blockquote>
              </Card>
            </section>

            {/* FAQ */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((f, i) => (
                  <AccordionItem key={i} value={`q${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Related */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Continue learning</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { to: "/tools/rfp-response-template-generator", title: "RFP Response Template Generator" },
                  { to: "/tools/rfp-template-library", title: "RFP Template Library" },
                  { to: "/tools/bid-no-bid-scorecard", title: "Bid / No-Bid Scorecard" },
                ].map((r) => (
                  <Link key={r.to} to={r.to} className="group">
                    <Card className="p-4 h-full hover:border-primary/40 transition-colors">
                      <p className="font-medium group-hover:text-primary transition-colors text-sm">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">Open tool <ArrowRight className="h-3 w-3" /></p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
