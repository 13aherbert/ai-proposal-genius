import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { lookupSSOForEmail, initiateSSO } from "@/utils/auth/sso";

interface SSOLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SSOLoginDialog({ open, onOpenChange }: SSOLoginDialogProps) {
  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const info = await lookupSSOForEmail(email);
      if (!info?.ssoEnabled) {
        setError("No SSO is configured for this domain. Use email and password instead.");
        return;
      }
      const started = await initiateSSO(info, email);
      if (!started) {
        setError("Could not start SSO sign-in. Contact your administrator.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check SSO configuration");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />Sign in with SSO
          </DialogTitle>
          <DialogDescription>
            Enter your company email to sign in via your organization's identity provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="sso-email">Company Email</Label>
            <Input
              id="sso-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button onClick={handleCheck} disabled={isChecking || !email} className="w-full">
            {isChecking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking...</> : 'Continue with SSO'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
