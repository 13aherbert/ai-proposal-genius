import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompareNav } from "@/components/navigation/CompareNav";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { AuthForm } from "@/components/auth/AuthForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const comparisonRows = [
  { feature: "Starting Price", optirfp: "Free / $199/mo flat", competitor: "$35/user/month", winner: "optirfp" },
  { feature: "Pricing Model", optirfp: "Flat rate — unlimited users", competitor: "Per-seat pricing", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "14-day trial only", winner: "optirfp" },
  { feature: "RFP-Specific AI", optirfp: "Full AI pipeline: analyze, outline, draft", competitor: "No RFP-specific features", winner: "optirfp" },
  { feature: "Focus", optirfp: "Purpose-built for RFPs & proposals", competitor: "General: contracts, quotes, proposals, forms", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "1–2 weeks for full setup", winner: "optirfp" },
  { feature: "E-Signatures", optirfp: "Not included", competitor: "Built-in e-signatures", winner: "competitor" },
];

const ComparePandaDoc = () => {
  const [signupOpen, setSignupOpen] = useState(false);
  useSEO({
    title: "OptiRFP vs PandaDoc 2026 | RFP Specialist vs Generalist",
    description: "Compare OptiRFP and PandaDoc side by side. Purpose-built RFP AI at $199/mo flat vs $35/user/mo for a general document platform. 6 free projects — no trial limits.",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CompareNav />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">PandaDoc</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            RFP Specialist Beats Jack-of-All-Trades
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            PandaDoc handles contracts, quotes, and proposals — but it wasn't built for RFPs. OptiRFP's AI reads, analyzes, and drafts RFP responses automatically at a flat monthly rate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "$199/mo flat vs $35/user/mo" },
              { label: "RFP specialist vs generalist" },
              { label: "6 free projects vs 14-day trial" },
            ].map((item) => (
              <Card key={item.label} className="border-primary/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-bold mb-8 text-center">Feature-by-Feature Comparison</h2>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-1/3">Feature</TableHead>
                <TableHead className="w-1/3 text-primary font-bold">OptiRFP</TableHead>
                <TableHead className="w-1/3">PandaDoc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.optirfp}</span>
                      {row.winner === "optirfp" && <Badge variant="success" className="text-[10px] px-1.5 py-0">Winner</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{row.competitor}</span>
                      {row.winner === "competitor" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Winner</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12 w-full">
        {[
          { title: "Specialist vs Generalist", body: "PandaDoc is a document automation platform covering contracts, quotes, proposals, and forms. It's broad by design — which means RFP response is an afterthought. OptiRFP is purpose-built for RFPs: AI-powered analysis, requirement extraction, proposal outlining, and full draft generation." },
          { title: "Per-Seat Pricing Scales Against You", body: "PandaDoc charges $35 per user per month on their Business plan. A 10-person proposal team costs $350/month with no RFP-specific AI. OptiRFP's Growth plan at $199/month includes unlimited users and a full AI pipeline — saving you 43% even before counting the productivity gains." },
          { title: "A Real Free Tier, Not a Trial", body: "PandaDoc offers a 14-day free trial — barely enough time to evaluate the tool. OptiRFP's free Starter plan gives you 6 projects per year with no time limit and no credit card required. Take your time to see real results." },
          { title: "When to Choose PandaDoc vs OptiRFP", body: "If you primarily need e-signatures, contract management, and sales quotes, PandaDoc is a strong choice. But if you respond to RFPs and RFIs, OptiRFP's specialized AI will save your team hours per proposal while costing less per user." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Need a tool built specifically for RFPs?</p>
          <Button onClick={() => setSignupOpen(true)}>
            Start Free — No Credit Card <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="sm:max-w-md">
          <ErrorBoundary name="CompareSignupModal">
            <AuthForm defaultView="sign_up" variant="dialog" />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>

      <div className="pb-16" />
    </div>
  );
};

export default ComparePandaDoc;
