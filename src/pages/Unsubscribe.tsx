import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Loader2, MailX } from "lucide-react";

const FN_URL = `https://bmopbbkfxkgzlbmhhgox.supabase.co/functions/v1/email-unsubscribe`;

type Status = "idle" | "verifying" | "ready" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const queryString = useMemo(
    () => `email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
    [email, token],
  );

  useEffect(() => {
    let active = true;
    if (!email || !token) {
      setStatus("error");
      setMessage("This unsubscribe link is missing required information. Please use the link from your email.");
      return;
    }
    setStatus("verifying");
    fetch(`${FN_URL}?${queryString}`, { method: "GET" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!active) return;
        if (r.ok && data.ok) {
          setStatus("ready");
        } else {
          setStatus("error");
          setMessage(data.error || "This unsubscribe link is invalid or has expired.");
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage("We couldn't verify this link. Please try again later.");
      });
    return () => {
      active = false;
    };
  }, [email, token, queryString]);

  const handleConfirm = async () => {
    setStatus("submitting");
    try {
      const r = await fetch(`${FN_URL}?${queryString}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        setStatus("done");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            {status === "done" ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : status === "error" ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <MailX className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <CardTitle>
            {status === "done"
              ? "You've been unsubscribed"
              : status === "error"
                ? "Unable to unsubscribe"
                : "Unsubscribe from OptiRFP emails"}
          </CardTitle>
          <CardDescription>
            {status === "done"
              ? `We won't send any more emails to ${email}.`
              : status === "error"
                ? message
                : email
                  ? `Confirm you no longer want emails sent to ${email}.`
                  : "No email address provided."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(status === "verifying" || status === "submitting") && (
            <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              {status === "verifying" ? "Verifying link…" : "Updating preferences…"}
            </div>
          )}

          {status === "ready" && (
            <Button onClick={handleConfirm} className="w-full">
              Confirm unsubscribe
            </Button>
          )}

          {status === "done" && (
            <p className="text-xs text-muted-foreground text-center">
              Changed your mind? Contact{" "}
              <a href="mailto:support@optirfp.ai" className="underline">
                support@optirfp.ai
              </a>{" "}
              to opt back in.
            </p>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link to="/">Return to OptiRFP</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
