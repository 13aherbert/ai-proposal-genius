
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Copy, Check, Users, ArrowRight } from "lucide-react";

const REFERRAL_BASE = "https://optirfp.ai/?ref=";

export function ReferralCard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const referralLink = `${REFERRAL_BASE}${session?.user?.id?.slice(0, 8) || "demo"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy link"); }
  };

  return (
    <Card className="border-brand-green/30 bg-gradient-to-br from-brand-green/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-green" />
            Refer & Earn
          </CardTitle>
          <Badge variant="success">Give $50, Get 1 Month Free</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate border">
            {referralLink}
          </div>
          <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> 3 referrals</span>
            <span>1 converted</span>
            <span className="font-medium text-foreground">$50 earned</span>
          </div>
          <Button variant="link" size="sm" onClick={() => navigate("/referral")} className="gap-1">
            View Dashboard <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
