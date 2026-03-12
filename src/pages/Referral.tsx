
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Gift, Users, DollarSign, Copy, Mail, Twitter, Linkedin, Check, ArrowRight } from "lucide-react";

const REFERRAL_BASE = "https://ai-proposal-genius.lovable.app/?ref=";

export default function Referral() {
  const { session } = useAuth();
  const [copied, setCopied] = useState(false);

  // Mock data
  const stats = { totalReferrals: 3, converted: 1, creditsEarned: 50 };
  const nextMilestone = 5;
  const progress = (stats.totalReferrals / nextMilestone) * 100;

  const referralLink = `${REFERRAL_BASE}${session?.user?.id?.slice(0, 8) || "demo"}`;

  useEffect(() => {
    document.title = "Referral Program | OptiRFP";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Give $50, Get 1 Month Free. Share OptiRFP with your network and earn rewards.");
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy link"); }
  };

  const shareEmail = () => window.open(`mailto:?subject=Try OptiRFP - AI Proposal Tool&body=I've been using OptiRFP and thought you'd find it useful. Sign up with my link and get $50 off: ${encodeURIComponent(referralLink)}`);
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use @OptiRFP to win more proposals with AI. Try it free: ${referralLink}`)}`);
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`);

  const steps = [
    { num: "1", title: "Share Your Link", desc: "Send your unique referral link to colleagues and friends." },
    { num: "2", title: "They Sign Up", desc: "When they create an account using your link, they get $50 off." },
    { num: "3", title: "You Get Rewarded", desc: "Once they subscribe, you earn 1 month free on your plan." },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-8 px-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-green/20 via-brand-green/10 to-transparent border p-8 text-center">
        <Badge variant="success" className="mb-4">
          <Gift className="h-3 w-3 mr-1" /> Referral Program
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Give $50, Get 1 Month Free</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Share OptiRFP with your network. They save $50, you earn a free month for every converted referral.
        </p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-md px-4 py-2.5 text-sm font-mono truncate border">
              {referralLink}
            </div>
            <Button onClick={handleCopy} variant="outline" size="sm" className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={shareEmail} variant="outline" size="sm"><Mail className="h-4 w-4 mr-1.5" />Email</Button>
            <Button onClick={shareTwitter} variant="outline" size="sm"><Twitter className="h-4 w-4 mr-1.5" />Twitter</Button>
            <Button onClick={shareLinkedIn} variant="outline" size="sm"><Linkedin className="h-4 w-4 mr-1.5" />LinkedIn</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total Referrals", value: stats.totalReferrals, color: "text-blue-500" },
          { icon: Check, label: "Converted", value: stats.converted, color: "text-brand-green" },
          { icon: DollarSign, label: "Credits Earned", value: `$${stats.creditsEarned}`, color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className={`p-3 rounded-full bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress to Next Reward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{stats.totalReferrals} referrals</span>
            <span className="text-muted-foreground">{nextMilestone} needed for bonus</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {nextMilestone - stats.totalReferrals} more referrals to unlock a bonus reward!
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center p-6">
              <div className="w-10 h-10 rounded-full bg-brand-green text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
