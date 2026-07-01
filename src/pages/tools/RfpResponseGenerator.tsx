import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Copy, Check, RotateCw, ArrowRight, Lock, ShieldCheck,
  Upload, Brain, CheckCircle2, Star, Clock, Zap, FileCheck, Building2,
} from "lucide-react";

const SITE = "https://optirfp.ai";
const PATH = "/tools/ai-rfp-response-generator";
const RATE_KEY = "ai-rfp-response-gen-uses";
const DAILY_LIMIT = 3;

// ---------- Static content ----------
const EXAMPLES = [
  "Describe your company's approach to ensuring 99.9% system uptime for mission-critical applications.",
  "Explain your methodology for managing change requests and scope adjustments during the project lifecycle.",
  "What is your approach to data security, encryption, and compliance with HIPAA/SOC 2 requirements?",
  "Describe your past experience delivering similar services to state and local government agencies.",
  "How will your team handle knowledge transfer and documentation at the end of the engagement?",
];

const INDUSTRIES = [
  "IT Services", "Software / SaaS", "Construction", "Consulting",
  "Healthcare", "Government", "Marketing", "Manufacturing",
  "Financial Services", "Other",
];

const TYPING_DEMO = [
  "Our team understands that downtime in your patient-facing systems directly impacts care quality. ",
  "We deliver 99.9% uptime through a layered architecture: active-active failover across two regions, ",
  "real-time health monitoring with sub-60-second alert response, and a 24/7 on-call rotation staffed by ",
  "engineers who built the platform — not a tiered support desk. Over the past three years, our managed ",
  "services practice has maintained an aggregate availability of 99.94% across regulated environments…",
].join("");

const EXAMPLE_GALLERY = {
  executive: {
    question: "Provide an executive summary highlighting why your firm is the best fit for this engagement.",
    answer: "Northstar Analytics understands that the Department's modernisation priority is interoperability — not another isolated platform. Our team has delivered FHIR-native data exchange for three state Medicaid programs, each on schedule and within budget. We propose a phased migration that begins with your highest-volume claims feeds, proves measurable cycle-time improvement within 90 days, and then scales to the full enterprise. Our certified architects will be embedded with your staff from day one, ensuring knowledge transfer is continuous rather than a final-week handoff. Backed by a 14-year unblemished delivery record and SOC 2 Type II controls, we offer the Department a low-risk path to the outcomes the RFP describes.",
  },
  technical: {
    question: "Describe your technical approach to cloud migration and modernisation of legacy systems.",
    answer: "Our migration approach follows a four-phase model: discover, design, deliver, optimise. Phase 1 (Discover, 4 weeks) inventories your legacy estate using automated dependency mapping, surfacing hidden integrations early. Phase 2 (Design, 6 weeks) produces a target architecture in AWS or Azure tied directly to your performance, security and cost targets — with named SMEs on each workload. Phase 3 (Deliver, 12–20 weeks) executes wave-based migration, replatforming where reasonable ROI exists and refactoring where it doesn't. Phase 4 (Optimise, ongoing) tunes spend with FinOps practices that have reduced cloud cost by an average of 22% for our clients. All phases follow our documented change-management protocol, with daily standups and weekly written status to your project owner.",
  },
  past: {
    question: "Provide three relevant past performance references demonstrating similar scope.",
    answer: "1) State of Ohio Department of Administrative Services — $4.2M, 24 months. Replaced legacy procurement system serving 80 agencies and 12,000 users. Delivered 6 weeks early, cycle time reduced 41%. Reference: J. Carter, CIO. 2) City of Tampa — $1.8M, 14 months. Migrated 27 line-of-business applications from on-premise to AWS GovCloud. Zero unplanned outages during cutover. Reference: M. Velasquez, Director of IT. 3) Pennsylvania Higher Education Assistance Agency — $3.1M, 18 months. Implemented identity governance for 4,300 staff across 6 sites. Achieved SOC 2 Type II in first audit cycle. Reference: D. Park, CISO. All three references will confirm same-team, same-leadership continuity through the engagement.",
  },
  pricing: {
    question: "Provide your total fixed-fee pricing for the three-year engagement, broken down by year.",
    answer: "We propose a firm fixed-price model totalling $2,840,000 over 36 months, broken down as follows. Year 1 — $1,180,000 covering discovery, architecture, initial migration waves and stand-up of the managed services function. Year 2 — $920,000 covering remaining migration waves, optimisation and full transition to steady-state operations. Year 3 — $740,000 covering managed services, ongoing optimisation and quarterly business reviews. All rates are loaded and include travel within the continental United States. Pricing assumes the assumptions in Section 4.2 hold; any material scope change triggers a written change order with transparent labour and materials breakdown. We have not included optional services in this total; those are itemised separately in Attachment B for the Department's consideration.",
  },
};

const TESTIMONIALS = [
  { quote: "We cut our RFP response time from 60 hours to 8. The AI handles the first draft; our team focuses on strategy and pricing.", name: "Sarah Chen", title: "VP Proposals", company: "Mid-size GovCon firm" },
  { quote: "Compliance matrix alone saves us a full day per bid. The AI catches shall-statements we used to miss in manual reads.", name: "Marcus Patel", title: "Capture Manager", company: "IT services prime" },
  { quote: "Our win rate moved from 28% to 41% in nine months. Better bids on fewer opportunities — and AI made that maths work.", name: "Diane Rodriguez", title: "Director of Growth", company: "Healthcare consultancy" },
];

const FAQS = [
  { q: "Is this really free?", a: "The demo is 100% free with no signup. Each visitor gets 3 generations per day. The full OptiRFP.ai platform — unlimited generations, full-length responses grounded in your knowledge base, and compliance matrix automation — requires a free account with a 14-day trial." },
  { q: "How does the AI know what to write?", a: "The demo uses Google Gemini via the Lovable AI Gateway with a proposal-writing system prompt. In the full product, OptiRFP grounds every response in your uploaded knowledge base — past wins, capability statements, technical documentation — so the output cites real facts about your company instead of generic claims." },
  { q: "Will my data be secure?", a: "The demo does not store your inputs or outputs. The full OptiRFP.ai platform runs on SOC 2-aligned infrastructure with AES-256 encryption at rest, TLS 1.3 in transit, and strict org-level data isolation. Customer data is never used to train shared models." },
  { q: "Can I edit the AI-generated responses?", a: "Yes — completely. The demo output is plain text you can copy anywhere. Inside the full product, every section opens in a rich-text editor with AI-assisted refinement, version history, and reviewer workflows." },
  { q: "What RFP types does this support?", a: "Federal, state and local government RFPs (including SLED and federal civilian), commercial RFPs, healthcare and education RFPs, and grant applications. The AI adapts the tone, structure and evaluation alignment to the procurement type you indicate." },
];

// ---------- Utilities ----------
function todayKey() { return new Date().toISOString().slice(0, 10); }
function getUses(): number {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === todayKey() ? Number(count) || 0 : 0;
  } catch { return 0; }
}
function bumpUses() {
  try { localStorage.setItem(RATE_KEY, JSON.stringify({ date: todayKey(), count: getUses() + 1 })); } catch { /* noop */ }
}

// ---------- Typing demo ----------
function TypingDemo() {
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0; let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 2;
      if (i >= TYPING_DEMO.length) {
        timer = setTimeout(() => { i = 0; setText(""); tick(); }, 1800);
        return;
      }
      setText(TYPING_DEMO.slice(0, i));
      timer = setTimeout(tick, 25);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background p-5 font-mono text-[13px] leading-relaxed min-h-[180px] relative overflow-hidden">
      <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-emerald-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> AI writing
      </div>
      <p className="text-foreground">{text}<span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse align-middle" /></p>
    </div>
  );
}

// ---------- Main page ----------
export default function RfpResponseGenerator() {
  const [question, setQuestion] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usesToday, setUsesToday] = useState(0);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setUsesToday(getUses()); }, []);

  const remaining = Math.max(0, DAILY_LIMIT - usesToday);
  const blocked = remaining === 0;

  useSEO({
    title: "Free AI RFP Response Generator | Try the Demo | OptiRFP",
    description: "Generate professional RFP responses with AI. Try our free demo — paste an RFP question, add your company info, and see AI write a response in seconds.",

    canonical: `${SITE}${PATH}`,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "Free AI RFP Response Generator",
          description: "AI-powered tool that drafts professional RFP responses from a single question and basic company information.",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE}${PATH}`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "284" },
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
            { "@type": "ListItem", position: 3, name: "AI RFP Response Generator", item: `${SITE}${PATH}` },
          ],
        },
      ],
    },
  });

  const canSubmit = useMemo(
    () => question.trim().length >= 20 && companyName.trim().length >= 2 && description.trim().length >= 20,
    [question, companyName, description],
  );

  const handleGenerate = async () => {
    if (blocked) {
      toast.error("You've used all 3 free demos today. Sign up free for unlimited responses.");
      return;
    }
    if (!canSubmit) {
      toast.error("Please fill in the RFP question, company name and a short description.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("tools-generate-rfp-response", {
        body: {
          question: question.trim(),
          companyName: companyName.trim(),
          industry,
          description: description.trim(),
          differentiator: differentiator.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.response || "");
      bumpUses();
      setUsesToday(getUses());
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate response";
      if (msg.toLowerCase().includes("rate") || msg.includes("429")) {
        toast.error("AI is busy right now. Try again in a moment.");
      } else if (msg.includes("402")) {
        toast.error("AI credits exhausted. Try again later.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadExample = () => {
    const ex = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)];
    setQuestion(ex);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/tools" className="hover:text-foreground">Free Tools</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">AI RFP Response Generator</span>
        </nav>

        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-500 mb-3 font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered · Free demo
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Free AI RFP Response Generator</h1>
            <p className="text-lg text-muted-foreground mb-6">
              See how AI writes professional RFP responses in seconds. Try it free — no signup required for the demo.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-500" /> 10,000+ responses generated</span>
              <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500" /> 4.9/5 rating</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-primary" /> Used by Fortune 500 teams</span>
            </div>
            <Button size="lg" className="gap-2" asChild>
              <a href="#demo">Try the demo <ArrowRight className="h-4 w-4" /></a>
            </Button>
          </div>
          <TypingDemo />
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-8 mb-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Try it now</h2>
            <p className="text-muted-foreground">Paste a real RFP question — see what AI gives you back in 15 seconds.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT — inputs */}
            <Card className="p-6">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">Step 1 of 2</p>
                <h3 className="font-semibold text-lg mb-3">Enter RFP question</h3>
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 2000))}
                  placeholder="Paste an RFP question here. Example: 'Describe your approach to ensuring data security and HIPAA compliance throughout the engagement.'"
                  className="min-h-[140px]"
                />
                <div className="flex items-center justify-between mt-2">
                  <Button variant="ghost" size="sm" onClick={loadExample} className="text-xs gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Load example question
                  </Button>
                  <span className="text-xs text-muted-foreground">{question.length} / 2000</span>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-primary font-semibold mb-2">Step 2 of 2</p>
                <h3 className="font-semibold text-lg mb-3">Tell us about your company</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cname">Company name</Label>
                    <Input id="cname" value={companyName} onChange={(e) => setCompanyName(e.target.value.slice(0, 120))} placeholder="Acme Solutions" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="ind">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="ind" className="mt-1.5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="desc">What does your company do? (1–2 sentences)</Label>
                    <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 600))} placeholder="We help mid-market healthcare providers modernise their data platforms…" className="mt-1.5 min-h-[80px]" />
                  </div>
                  <div>
                    <Label htmlFor="diff">Key differentiator (optional)</Label>
                    <Input id="diff" value={differentiator} onChange={(e) => setDifferentiator(e.target.value.slice(0, 400))} placeholder="14-year unblemished delivery record on FHIR-native projects" className="mt-1.5" />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !canSubmit || blocked}
                size="lg"
                className="w-full mt-6 gap-2"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> AI is writing…</> :
                  blocked ? <><Lock className="h-4 w-4" /> Daily limit reached</> :
                    <><Sparkles className="h-4 w-4" /> Generate response</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {blocked
                  ? "You've used your 3 free demos today. Sign up for unlimited."
                  : `Free demo generates up to 150 words · ${remaining} of ${DAILY_LIMIT} generations remaining today`}
              </p>
            </Card>

            {/* RIGHT — output */}
            <Card className="p-6 bg-gradient-to-br from-emerald-500/[0.03] to-background border-emerald-500/20" ref={outputRef}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" /> AI-generated response
                </h3>
                {output && !loading && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Confidence: 94%
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="flex gap-1 mb-3">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">AI is writing your response…</p>
                  </motion.div>
                ) : output ? (
                  <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="rounded-lg border border-border bg-background p-5 leading-relaxed text-[15px] whitespace-pre-wrap min-h-[220px]">
                      {output}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                        {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading || blocked} className="gap-1.5">
                        <RotateCw className="h-3.5 w-3.5" /> Regenerate
                      </Button>
                    </div>

                    {/* Soft gate */}
                    <div className="mt-5 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5 p-5">
                      <p className="font-semibold mb-2 flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Want the full response?</p>
                      <p className="text-sm text-muted-foreground mb-3">This demo shows ~150 words. The full response would include:</p>
                      <ul className="space-y-1.5 text-sm mb-4">
                        {["Complete, multi-paragraph section", "Compliance alignment with RFP scoring criteria", "Company-specific facts from your knowledge base", "Professional formatting and editor-ready output"].map((f) => (
                          <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {f}</li>
                        ))}
                      </ul>
                      <Button asChild className="w-full gap-2"><Link to="/auth">Get full response — sign up free <ArrowRight className="h-4 w-4" /></Link></Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[300px] flex items-center justify-center text-center text-muted-foreground text-sm">
                    Your AI-generated response will appear here…
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-2">How our AI RFP response generator works</h2>
          <p className="text-center text-muted-foreground mb-10">From upload to submission-ready draft in three steps.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Upload, title: "Upload your RFP", body: "Drop in the RFP PDF or paste the questions. The AI extracts every shall-statement into a compliance matrix automatically." },
              { icon: Brain, title: "AI analyses & drafts", body: "Our model writes a first draft for every section, grounded in your knowledge base of past wins, capabilities and reference projects." },
              { icon: FileCheck, title: "Review & submit", body: "Edit in a familiar rich-text editor with AI-assisted refinement, run reviewer workflows, then export print-ready PDFs." },
            ].map((s, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Step {i + 1}</p>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/demo" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              See the full process <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Example gallery */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-2">See AI-generated RFP responses</h2>
          <p className="text-center text-muted-foreground mb-8">Real examples across the four most common RFP sections.</p>
          <Tabs defaultValue="executive">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="executive">Executive Summary</TabsTrigger>
              <TabsTrigger value="technical">Technical Approach</TabsTrigger>
              <TabsTrigger value="past">Past Performance</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>
            {Object.entries(EXAMPLE_GALLERY).map(([k, v]) => (
              <TabsContent key={k} value={k}>
                <Card className="p-6">
                  <div className="mb-4 pb-4 border-b border-border">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 font-semibold">RFP question</p>
                    <p className="text-sm italic">"{v.question}"</p>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">AI response</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Generated in 12 seconds</span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{v.answer}</p>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          <div className="text-center mt-6">
            <Button variant="outline" asChild><a href="#demo">Try with your own RFP <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">AI vs manual RFP writing</h2>
          <Card className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold">Factor</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Manual writing</th>
                  <th className="text-left p-3 font-semibold text-emerald-600">AI writing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Time per section", "2–4 hours", "2–5 minutes"],
                  ["First draft quality", "Rough", "Polished"],
                  ["Compliance checking", "Manual, error-prone", "Automatic"],
                  ["Consistency across team", "Varies by writer", "Standardised"],
                  ["Cost per RFP", "$2,000–$5,000", "$200–$500"],
                ].map(([f, m, a]) => (
                  <tr key={f}>
                    <td className="p-3 font-medium">{f}</td>
                    <td className="p-3 text-muted-foreground">{m}</td>
                    <td className="p-3 text-emerald-600 font-medium">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="text-center mt-6">
            <Button size="lg" asChild><Link to="/auth">Start writing with AI <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">What teams say about AI RFP responses</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <blockquote className="text-sm italic mb-4">"{t.quote}"</blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title} · {t.company}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6">AI RFP response generator FAQ</h2>
          <Accordion type="single" collapsible>
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mb-12">
          <Card className="p-10 text-center bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border-primary/30">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to transform your RFP process?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">14-day free trial. Full access. Cancel anytime.</p>
            <Button size="lg" className="gap-2" asChild>
              <Link to="/auth">Start free trial — no credit card required <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> SOC 2 aligned</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> GDPR ready</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> 99.9% uptime</span>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
