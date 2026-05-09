import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

type State =
  | { kind: "loading" }
  | { kind: "needs_auth" }
  | { kind: "success"; organizationName: string | null }
  | { kind: "expired" }
  | { kind: "wrong_email"; invitedEmail?: string }
  | { kind: "already_accepted" }
  | { kind: "error"; message: string };

export default function AcceptInvitation() {
  useSEO({ title: "Accept Invitation — OptiRFP", description: "Accept your team invitation to join an OptiRFP workspace." });
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { session, loading: authLoading } = useAuth();
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", message: "Missing invitation token." });
      return;
    }
    if (authLoading) return;
    if (!user) {
      setState({ kind: "needs_auth" });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("accept-invitation", {
        body: { invitationToken: token },
      });
      if (cancelled) return;

      const payload = (data ?? {}) as any;
      if (error || (!payload.success && !payload.organizationId)) {
        const code = payload.code;
        if (code === "expired") return setState({ kind: "expired" });
        if (code === "wrong_email") return setState({ kind: "wrong_email", invitedEmail: payload.invitedEmail });
        if (code === "already_accepted") return setState({ kind: "already_accepted" });
        return setState({ kind: "error", message: payload.error || error?.message || "Could not accept invitation." });
      }

      setState({ kind: "success", organizationName: payload.organizationName ?? null });
      setTimeout(() => navigate("/dashboard"), 1500);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Team invitation</CardTitle>
          <CardDescription>OptiRFP</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state.kind === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validating invitation…</p>
            </div>
          )}

          {state.kind === "needs_auth" && (
            <div className="space-y-4 py-2">
              <Mail className="h-10 w-10 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Please sign in (or create an account) with the email address that received the invitation to continue.
              </p>
              <Button asChild className="w-full">
                <Link to={`/?redirect=${encodeURIComponent(`/accept-invitation?token=${token}`)}`}>Sign in to accept</Link>
              </Button>
            </div>
          )}

          {state.kind === "success" && (
            <div className="space-y-3 py-2">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="font-medium">
                You've joined {state.organizationName ?? "the organization"}.
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
            </div>
          )}

          {state.kind === "expired" && (
            <div className="space-y-3 py-2">
              <Clock className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="font-medium">This invitation has expired.</p>
              <p className="text-sm text-muted-foreground">Ask your team admin to send a new one.</p>
            </div>
          )}

          {state.kind === "already_accepted" && (
            <div className="space-y-3 py-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="font-medium">This invitation has already been accepted.</p>
              <Button asChild className="w-full">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          )}

          {state.kind === "wrong_email" && (
            <div className="space-y-3 py-2">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">This invitation is for a different email address.</p>
              {state.invitedEmail && (
                <p className="text-sm text-muted-foreground">Invited address: <strong>{state.invitedEmail}</strong></p>
              )}
              <p className="text-sm text-muted-foreground">Sign out and sign back in with the invited email to continue.</p>
            </div>
          )}

          {state.kind === "error" && (
            <div className="space-y-3 py-2">
              <XCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm text-muted-foreground">{state.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
