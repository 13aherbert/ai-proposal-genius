import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompareNav } from "@/components/navigation/CompareNav";
import { CheckCircle, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { SEO_CONFIG } from "@/config/seo-config";
import { AuthForm } from "@/components/auth/AuthForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const comparisonRows = [
  { feature: "Starting Price", optirfp: "Free / $199/mo flat", competitor: "$49/user/month", winner: "optirfp" },
  { feature: "Pricing Model", optirfp: "Flat rate — unlimited users", competitor: "Per-seat pricing", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "14-day trial only", winner: "optirfp" },
  { feature: "RFP Analysis", optirfp: "AI-powered requirement extraction", competitor: "Not available — general proposal tool", winner: "optirfp" },
  { feature: "Proposal Drafting", optirfp: "AI generates full drafts", competitor: "Manual templates & drag-and-drop", winner: "optirfp" },
  { feature: "Focus", optirfp: "Purpose-built for RFPs", competitor: "General proposals, quotes, contracts", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "1–2 weeks template setup", winner: "optirfp" },
];

const CompareProposify = () => {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO {...SEO_CONFIG.compareProposify} />
      <CompareNav />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">Proposify</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            RFP Specialist vs General Proposal Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Proposify is great for sales proposals and contracts — but it wasn't built for RFPs. OptiRFP's AI analyzes requirements, drafts responses, and evaluates proposals automatically.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "$199/mo flat vs $49/user/mo" },
              { label: "AI-powered vs template-based" },
              { label: "RFP-focused vs general proposals" },
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
                <TableHead className="w-1/3">Proposify</TableHead>
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
                  <TableCell className="text-muted-foreground">{row.competitor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12 w-full">
        {[
          { title: "Built for RFPs, Not General Proposals", body: "Proposify excels at sales proposals with beautiful templates, but it has no RFP analysis, no requirement extraction, and no AI-powered response drafting. OptiRFP was purpose-built for the RFP workflow — upload, analyze, draft, and win." },
          { title: "Per-Seat Costs Add Up Fast", body: "Proposify charges $49 per user per month. A team of 10 pays $490/month — and you still have to write proposals manually. OptiRFP's Growth plan at $199/month includes unlimited users and AI that does the writing for you." },
          { title: "AI That Drafts, Not Just Templates", body: "Proposify gives you drag-and-drop templates to manually assemble proposals. OptiRFP's AI reads the RFP, extracts requirements, generates proposal outlines, and drafts complete responses — cutting your response time by up to 80%." },
          { title: "Why Teams Choose OptiRFP for RFPs", body: "Teams that respond to RFPs and RFIs need specialized tools. OptiRFP's AI understands procurement language, compliance requirements, and evaluation criteria — things a general proposal tool like Proposify simply wasn't designed for." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Need a real RFP tool, not a template builder?</p>
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

export default CompareProposify;
