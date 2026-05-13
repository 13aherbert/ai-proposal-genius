import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Infinity as InfinityIcon, Sparkles, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/use-seo";

const leadSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  name: z.string().trim().max(100).optional().or(z.literal("")),
});

const HIGHLIGHTS = [
  { title: "36 RFP projects per year — for life", body: "Run a full proposal pipeline without monthly project caps." },
  { title: "Enhanced AI proposal drafting", body: "Claude Sonnet 4 + Gemini analysis on every project." },
  { title: "Unlimited team members", body: "Collaborate with your whole capture team — no per-seat fees." },
  { title: "10 opportunity searches / month", body: "SAM.gov, Grants.gov, state portals, FedConnect, and more." },
  { title: "Knowledge base with smart context", body: "Past proposals fuel future drafts automatically." },
  { title: "Priority email support", body: "Real humans, fast turnaround." },
];

const FAQ = [
  { q: "Is this really one payment, forever?", a: "Yes. One charge, no renewals, no surprise upgrades. Your account stays on the Growth plan permanently." },
  { q: "How many spots are available?", a: "We're capping the lifetime tier to keep support quality high. Spots are allocated first-come, first-served from the waitlist." },
  { q: "What happens if I already have a paid plan?", a: "The lifetime deal is for new accounts only. Existing paid subscribers stay on their current plan." },
  { q: "Can I get a refund?", a: "Yes — full refund within 14 days of purchase if it's not the right fit." },
  { q: "Do annual project quotas still apply?", a: "Yes. You get 36 fresh projects every January 1st, for life. Unused projects don't roll over." },
];

export default function LifetimeDealLanding() {
  useSEO({
    title: "OptiRFP Lifetime Deal — Pay Once, Use Forever",
    description: "Limited lifetime access to OptiRFP's Growth plan: AI proposal drafting, opportunity search, unlimited team members. One payment, no renewals.",
    canonical: "https://optirfp.ai/lifetime-deal",
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ email, name });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("lifetime_deal_leads").insert({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || null,
      source: "lifetime-deal-landing",
    });
    setSubmitting(false);
    if (error) {
      // Unique violation → already on the list
      if (error.code === "23505") {
        setSubmitted(true);
        toast.success("You're already on the list — we'll be in touch.");
        return;
      }
      console.error("Lead submit error:", error);
      toast.error("Could not save your email. Please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("You're on the list — watch your inbox.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" /> Limited Lifetime Offer — invitation only
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Win more RFPs.<br />
          <span className="text-primary">Pay once. Use forever.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Get OptiRFP's Growth plan — AI proposal drafting, opportunity search, and unlimited team
          members — for a single one-time payment. No subscription, no renewals.
        </p>

        {/* Email capture */}
        <Card className="max-w-xl mx-auto border-primary/30 shadow-lg">
          <CardContent className="pt-6">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">You're on the list</h3>
                <p className="text-muted-foreground">
                  We'll email <span className="font-medium">{email}</span> with your code as soon as the next batch opens.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3 text-left">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    aria-label="Your name"
                  />
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    aria-label="Email"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full h-12" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : (
                    <><Mail className="h-4 w-4 mr-2" />Get notified when codes drop</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  No spam. Unsubscribe anytime. Already have a code?{" "}
                  <Link to="/lifetime" className="underline">Redeem it here →</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* What's included */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2">
            <InfinityIcon className="h-7 w-7 text-primary" /> What you get, forever
          </h2>
          <p className="text-muted-foreground">Every Growth plan feature, permanently unlocked.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title} className="border-border/60">
              <CardContent className="pt-6">
                <CheckCircle2 className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{h.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="bg-muted/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">14-day money-back guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Try OptiRFP risk-free. If it's not the right fit, email us within 14 days for a full refund.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently asked</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* JSON-LD FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: { "@type": "Answer", text: item.a },
              })),
            }),
          }}
        />
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto max-w-3xl px-4 pb-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to lock in your spot?</h2>
        <p className="text-muted-foreground mb-6">
          Drop your email above. We'll send your code as soon as the next batch opens.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/pricing">See regular pricing</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/lifetime">I already have a code →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
