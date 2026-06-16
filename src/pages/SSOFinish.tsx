import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

/**
 * Public route that finishes an external SSO flow.
 * The OIDC/SAML validator redirects the browser here with ?token=<handoff>.
 * We POST it to sso-auth-callback, which returns a Supabase magic link URL,
 * then we navigate the browser to that URL to establish the session.
 */
export default function SSOFinish() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = params.get("token");
    if (!token) {
      setError("Missing SSO token.");
      return;
    }

    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("sso-auth-callback", {
          body: { handoffToken: token },
        });
        if (fnErr) throw fnErr;
        if (!data?.redirectUrl) throw new Error("No session URL returned");
        window.location.replace(data.redirectUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "SSO sign-in failed";
        setError(msg);
      }
    })();
  }, [params, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">SSO sign-in failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate("/auth")}
              className="text-primary text-sm underline"
            >
              Return to sign in
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Completing sign-in…</h1>
            <p className="text-sm text-muted-foreground">
              Verifying your identity with your organization's provider.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
