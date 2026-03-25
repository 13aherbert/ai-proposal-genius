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
  { feature: "Starting Price", optirfp: "Free / $199/mo", competitor: "Custom quotes only", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "No free tier", winner: "optirfp" },
  { feature: "Pricing Transparency", optirfp: "Published pricing, cancel anytime", competitor: "Sales call required", winner: "optirfp" },
  { feature: "AI Capabilities", optirfp: "Full AI pipeline: analyze, outline, draft", competitor: "AI-assisted with manual steps", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "1–2 weeks onboarding", winner: "optirfp" },
  { feature: "Support", optirfp: "Email + docs + community", competitor: "Email support", winner: "tie" },
];

const CompareAutoRFP = () => {
  const [signupOpen, setSignupOpen] = useState(false);
  useSEO({
    title: "OptiRFP vs AutoRFP 2026 | Comparison",
    description: "Compare OptiRFP and AutoRFP side by side. Transparent pricing from $0/mo vs custom quotes. See why teams choose OptiRFP's free tier and AI-native approach.",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CompareNav />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">AutoRFP</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Transparent Pricing. Free to Start.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Why request a custom quote when you can start for free? OptiRFP gives you published pricing, a generous free tier, and AI that does the heavy lifting.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "$199/mo vs custom quotes" },
              { label: "Free tier vs no free plan" },
              { label: "Transparent vs opaque pricing" },
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
                <TableHead className="w-1/3">AutoRFP</TableHead>
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
          { title: "Transparent Pricing You Can Trust", body: "AutoRFP requires a sales call just to learn what it costs. OptiRFP publishes its pricing openly — start free, upgrade to $199/mo when you're ready, cancel anytime with no contracts." },
          { title: "A Free Tier That Actually Works", body: "With OptiRFP's free plan you get 6 projects per year including AI analysis, proposal outlines, and document generation. No credit card required — just sign up and start winning proposals." },
          { title: "AI That Does the Work", body: "Both platforms use AI, but OptiRFP's end-to-end pipeline handles analysis, outlining, and drafting automatically. AutoRFP still requires significant manual effort between AI-assisted steps." },
          { title: "Why Teams Choose OptiRFP", body: "Teams choose OptiRFP for its transparent pricing, zero-friction onboarding, and AI that handles the entire proposal workflow. No sales calls, no long contracts — just results." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Ready to try the modern alternative?</p>
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

export default CompareAutoRFP;
