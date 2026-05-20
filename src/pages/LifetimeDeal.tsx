import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Infinity as InfinityIcon,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/use-seo";

type ValidationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "valid"; codeId: string; planSlug: string; priceId: string };

const REASON_COPY: Record<string, string> = {
  not_found: "We couldn't find that lifetime deal code.",
  inactive: "This lifetime deal is no longer active.",
  expired: "This lifetime deal has expired.",
  sold_out: "All lifetime deal spots have been claimed.",
  missing_code: "Enter your lifetime deal code to claim it.",
  error: "Something went wrong validating this code.",
};

const FEATURE_LABELS: Record<string, string> = {
  basic_ai: "AI proposal drafting",
  enhanced_ai: "Enhanced AI proposal drafting",
  advanced_ai: "Advanced AI features",
  no_watermark: "Clean exports (no watermark)",
  watermarked_exports: "Watermarked exports",
  opportunity_search_10: "10 opportunity searches per month",
  unlimited_opportunity_search: "Unlimited opportunity searches",
  email_support: "Email support",
  priority_support: "Priority support",
  community_support: "Community support",
  team_collaboration: "Unlimited team members",
  api_access: "API access & CRM integrations",
  ai_evaluation: "AI proposal evaluation",
  soc2_compliance: "SOC 2 compliance",
  dedicated_csm: "Dedicated CSM",
  sso: "SSO / SAML",
  on_premise: "On-premise option",
  all_features: "All features included",
};

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
  { q: "How many spots are available?", a: "We're capping the lifetime tier to keep support quality high. Spots are allocated first-come, first-served." },
  { q: "What happens if I already have a paid plan?", a: "The lifetime deal is for new accounts only. Existing paid subscribers stay on their current plan." },
  { q: "Can I get a refund?", a: "Yes — full refund within 14 days of purchase if it's not the right fit." },
  { q: "Do annual project quotas still apply?", a: "Yes. You get 36 fresh projects every January 1st, for life. Unused projects don't roll over." },
];

const leadSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
  name: z.string().trim().max(100).optional().or(z.literal("")),
});

export default function LifetimeDeal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading } = useSubscription();

  const code = useMemo(() => params.get("code")?.trim() ?? "", [params]);
  const [state, setState] = useState<ValidationState>({ status: code ? "loading" : "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [codeInput, setCodeInput] = useState(code);
  const [tier, setTier] = useState<{ name: string; projects_limit: number; features: string[] } | null>(null);

  // Waitlist (fallback) state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useSEO({
    title: "OptiRFP Lifetime Deal — Pay Once, Use Forever",
    description:
      "Limited lifetime access to OptiRFP's Growth plan: AI proposal drafting, opportunity search, unlimited team members. One payment, no renewals.",
    canonical: "https://optirfp.ai/lifetime",
  });

  const isIneligible = useMemo(() => {
    if (!subscription) return false;
    if ((subscription as { is_lifetime?: boolean }).is_lifetime === true) return true;
    if (
      subscription.status === "active" &&
      subscription.plan_type &&
      !["starter", "trial"].includes(subscription.plan_type)
    ) {
      return true;
    }
    return false;
  }, [subscription]);

  // Validate code from URL
  useEffect(() => {
    let cancelled = false;
    if (!code) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    supabase.functions
      .invoke("validate-lifetime-code", { body: { code } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: "invalid", reason: "error" });
          return;
        }
        if (data?.valid) {
          setState({
            status: "valid",
            codeId: data.code_id,
            planSlug: data.plan_slug,
            priceId: data.price_id,
          });
        } else {
          setState({ status: "invalid", reason: data?.reason ?? "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Fetch tier metadata once we have a valid plan_slug
  useEffect(() => {
    if (state.status !== "valid") return;
    let cancelled = false;
    supabase
      .from("pricing_tiers")
      .select("name, projects_limit, features")
      .eq("slug", state.planSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setTier({
          name: data.name,
          projects_limit: data.projects_limit,
          features: Array.isArray(data.features) ? (data.features as string[]) : [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  const applyCode = () => {
    const trimmed = codeInput.trim();
    if (!trimmed) return;
    setParams({ code: trimmed });
  };

  const handleClaim = async () => {
    if (state.status !== "valid") return;
    if (isIneligible) {
      toast.error("Your account already has a paid plan. The lifetime deal is for new accounts only.");
      return;
    }
    if (!session) {
      localStorage.setItem("lifetime_deal_code", code);
      navigate(`/auth?mode=signup&ltd=${encodeURIComponent(code)}`);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-lifetime-checkout", {
        body: { code },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Checkout URL missing");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Could not start checkout";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ email: leadEmail, name: leadName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLeadSubmitting(true);
    const { error } = await supabase.from("lifetime_deal_leads").insert({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name || null,
      source: "lifetime-deal-landing",
    });
    setLeadSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setLeadSubmitted(true);
        toast.success("You're already on the list — we'll be in touch.");
        return;
      }
      console.error("Lead submit error:", error);
      toast.error("Could not save your email. Please try again.");
      return;
    }
    setLeadSubmitted(true);
    toast.success("You're on the list — watch your inbox.");
  };

  const planName = tier?.name ?? "Growth";
  const projectsLine = tier
    ? tier.projects_limit === -1
      ? "Unlimited RFP projects per year"
      : `${tier.projects_limit} RFP projects per year — for life`
    : "36 RFP projects per year — for life";
  const features = tier?.features?.length
    ? tier.features.map((f) => FEATURE_LABELS[f] ?? f)
    : [
        "Enhanced AI proposal drafting",
        "Unlimited team members",
        "10 opportunity searches per month",
        "Knowledge base with smart context",
        "Email support",
      ];

  // ===== Hero card content (state-driven) =====
  const renderHeroCard = () => {
    if (authLoading || state.status === "loading") {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    // Eligible-and-valid → big claim CTA + features
    if (state.status === "valid" && !isIneligible && !subLoading) {
      return (
        <div className="space-y-5 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Code applied — {planName} plan unlocked</h3>
              <p className="text-sm text-muted-foreground">{projectsLine}</p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="w-full h-12 text-base" disabled={submitting} onClick={handleClaim}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Redirecting…
              </>
            ) : session ? (
              "Claim Lifetime Deal"
            ) : (
              "Sign up & Claim Lifetime Deal"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            One-time payment. Secure checkout via Stripe. Lifetime deal is for new accounts only.
          </p>
        </div>
      );
    }

    // Valid code but user already on a paid/lifetime plan
    if (state.status === "valid" && isIneligible && !subLoading) {
      return (
        <div className="text-center space-y-3 py-2">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-xl font-semibold">You already have a paid plan</h3>
          <p className="text-sm text-muted-foreground">
            The lifetime deal is reserved for new accounts. Your existing subscription stays active.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={() => navigate("/account/subscription")}>Manage subscription</Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </div>
      );
    }

    // idle (no code) or invalid → code entry, with waitlist fallback below
    const reason = state.status === "invalid" ? state.reason : "missing_code";
    return (
      <div className="space-y-4 text-left">
        {state.status === "invalid" && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <span>{REASON_COPY[reason] ?? REASON_COPY.error}</span>
          </div>
        )}
        <div>
          <label htmlFor="ltd-code" className="text-sm font-medium block mb-1.5">
            Have a lifetime deal code?
          </label>
          <div className="flex gap-2">
            <Input
              id="ltd-code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="PROMOCODE"
              className="font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCode();
              }}
            />
            <Button onClick={applyCode} disabled={!codeInput.trim()}>
              Apply
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          {!showWaitlist ? (
            <button
              type="button"
              onClick={() => setShowWaitlist(true)}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Don't have a code? Get notified when the next batch drops →
            </button>
          ) : leadSubmitted ? (
            <div className="text-center py-2">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">You're on the list</p>
              <p className="text-xs text-muted-foreground">
                We'll email <span className="font-medium">{leadEmail}</span> with your code.
              </p>
            </div>
          ) : (
            <form onSubmit={submitLead} className="space-y-2">
              <p className="text-sm font-medium">Get notified when codes drop</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  maxLength={100}
                  aria-label="Your name"
                />
                <Input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  maxLength={255}
                  aria-label="Email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={leadSubmitting}>
                {leadSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Notify me
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto max-w-4xl px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" /> Limited Lifetime Offer — invitation only
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Win more RFPs.
          <br />
          <span className="text-primary">Pay once. Use forever.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Get OptiRFP's {planName} plan — AI proposal drafting, opportunity search, and unlimited team
          members — for a single one-time payment. No subscription, no renewals.
        </p>

        <Card className="max-w-xl mx-auto border-primary/30 shadow-lg">
          <CardContent className="pt-6">{renderHeroCard()}</CardContent>
        </Card>
      </section>

      {/* What's included */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2">
            <InfinityIcon className="h-7 w-7 text-primary" /> What you get, forever
          </h2>
          <p className="text-muted-foreground">Every {planName} plan feature, permanently unlocked.</p>
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
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to lock it in?</h2>
        <p className="text-muted-foreground mb-6">
          Apply your code above, or join the waitlist for the next batch.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/pricing">See regular pricing</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
