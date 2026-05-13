import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Infinity as InfinityIcon, Loader2, Sparkles } from "lucide-react";
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
  missing_code: "Enter your lifetime deal code below to continue.",
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

  useSEO({
    title: "Lifetime Deal — One-Time Purchase | OptiRFP",
    description: "Claim your OptiRFP lifetime deal: pay once, use the Growth plan forever. Limited spots.",
  });

  // Detect ineligibility for already-paid or already-lifetime users
  const isIneligible = useMemo(() => {
    if (!subscription) return false;
    if ((subscription as any).is_lifetime === true) return true;
    if (
      subscription.status === "active" &&
      subscription.plan_type &&
      !["starter", "trial"].includes(subscription.plan_type)
    ) {
      return true;
    }
    return false;
  }, [subscription]);

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
    return () => { cancelled = true; };
  }, [code]);

  // Fetch tier metadata (features) once we have a valid plan_slug
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
    return () => { cancelled = true; };
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
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Could not start checkout");
      setSubmitting(false);
    }
  };

  if (authLoading || (state.status === "loading")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Idle (no code) or invalid → show code-entry card
  if (state.status === "idle" || state.status === "invalid") {
    const reason = state.status === "invalid" ? state.reason : "missing_code";
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Enter your Lifetime Deal code</CardTitle>
            <CardDescription>{REASON_COPY[reason] ?? REASON_COPY.error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="PROMOCODE"
                className="font-mono"
                onKeyDown={(e) => { if (e.key === "Enter") applyCode(); }}
              />
              <Button onClick={applyCode} disabled={!codeInput.trim()}>Apply</Button>
            </div>
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/lifetime-deal")}>
                Don't have a code? Get notified →
              </Button>
            </div>
            <div className="text-center">
              <Button variant="link" size="sm" onClick={() => navigate("/pricing")}>
                Or view regular pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid code, but user already has a paid/lifetime subscription
  if (isIneligible && !subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>You already have a paid plan</CardTitle>
            <CardDescription>
              The lifetime deal is reserved for new accounts. Your existing subscription stays active.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <Button onClick={() => navigate("/account/subscription")}>Manage subscription</Button>
            <div>
              <Button variant="link" size="sm" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = tier?.features?.length
    ? tier.features.map((f) => FEATURE_LABELS[f] ?? f)
    : [
        "Enhanced AI proposal drafting",
        "Unlimited team members",
        "10 opportunity searches per month",
        "Knowledge base with smart context",
        "Email support",
      ];
  const projectsLine = tier
    ? tier.projects_limit === -1
      ? "Unlimited RFP projects per year"
      : `${tier.projects_limit} RFP projects per year — for life`
    : "36 RFP projects per year — for life";
  const planName = tier?.name ?? "Growth";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Limited Lifetime Offer
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {planName} Plan. <span className="text-primary">Yours forever.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pay once, use OptiRFP's {planName} plan for life. No monthly bills. No annual renewals.
          </p>
        </div>

        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfinityIcon className="h-5 w-5 text-primary" />
              What's included
            </CardTitle>
            <CardDescription>Everything in the {planName} plan, permanently unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              <li className="flex items-start gap-2 sm:col-span-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{projectsLine}</span>
              </li>
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="min-w-[260px] h-12 text-base"
            disabled={submitting}
            onClick={handleClaim}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting…</>
            ) : session ? "Claim Lifetime Deal" : "Sign up & Claim Lifetime Deal"}
          </Button>
          <p className="text-xs text-muted-foreground">
            One-time payment. Secure checkout via Stripe. Lifetime deal is for new accounts only.
          </p>
        </div>
      </div>
    </div>
  );
}
