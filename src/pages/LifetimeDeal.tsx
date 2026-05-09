import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Infinity as InfinityIcon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSEO } from "@/hooks/use-seo";

type ValidationState =
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "valid"; codeId: string; planSlug: string; priceId: string };

const REASON_COPY: Record<string, string> = {
  not_found: "We couldn't find that lifetime deal code.",
  inactive: "This lifetime deal is no longer active.",
  expired: "This lifetime deal has expired.",
  sold_out: "All lifetime deal spots have been claimed.",
  missing_code: "No lifetime deal code provided.",
  error: "Something went wrong validating this code.",
};

const FEATURES = [
  "36 RFP projects per year — for life",
  "Enhanced AI proposal drafting",
  "Unlimited team members",
  "10 monthly opportunity searches",
  "Knowledge base with smart context",
  "Email support",
];

export default function LifetimeDeal() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const code = useMemo(() => params.get("code")?.trim() ?? "", [params]);
  const [state, setState] = useState<ValidationState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Lifetime Deal — OptiRFP";
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!code) {
      setState({ status: "invalid", reason: "missing_code" });
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

  const handleClaim = async () => {
    if (state.status !== "valid") return;

    if (!session) {
      // Persist the code, then send to signup. AuthProvider will pick it up on SIGNED_IN.
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

  if (state.status === "loading" || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Lifetime Deal Unavailable</CardTitle>
            <CardDescription>{REASON_COPY[state.reason] ?? REASON_COPY.error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/pricing")}>View regular pricing</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Limited Lifetime Offer
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Growth Plan. <span className="text-primary">Yours forever.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pay once, use OptiRFP's Growth plan for life. No monthly bills. No annual renewals.
          </p>
        </div>

        <Card className="border-primary/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfinityIcon className="h-5 w-5 text-primary" />
              What's included
            </CardTitle>
            <CardDescription>Everything in the Growth plan, permanently unlocked.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
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
