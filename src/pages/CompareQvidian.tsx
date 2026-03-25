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
  { feature: "Starting Price", optirfp: "Free / $199/mo", competitor: "$30,000+/year", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "No free plan", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "8–12 weeks implementation", winner: "optirfp" },
  { feature: "Technology", optirfp: "Cloud-native, modern AI", competitor: "Legacy on-premise software", winner: "optirfp" },
  { feature: "AI Capabilities", optirfp: "End-to-end AI pipeline", competitor: "Basic content search & reuse", winner: "optirfp" },
  { feature: "Contract Required", optirfp: "No — cancel anytime", competitor: "Multi-year enterprise contracts", winner: "optirfp" },
  { feature: "Support", optirfp: "Email + docs + community", competitor: "Enterprise support (included)", winner: "tie" },
];

const CompareQvidian = () => {
  const [signupOpen, setSignupOpen] = useState(false);
  useSEO({
    title: "OptiRFP vs Qvidian (Upland) 2026 | Modern Cloud Alternative",
    description: "Compare OptiRFP and Upland Qvidian side by side. Modern cloud AI from $0/mo vs $30K+/year legacy software with 8-12 week implementation. Start free today.",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CompareNav />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">Qvidian</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Leave Legacy RFP Software Behind
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Upland Qvidian is legacy enterprise software with lengthy implementations and rigid contracts. OptiRFP is the modern, AI-native alternative — start free in minutes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Free vs $30K+/year" },
              { label: "5 min setup vs 8–12 weeks" },
              { label: "Modern AI vs legacy software" },
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
                <TableHead className="w-1/3">Qvidian</TableHead>
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
          { title: "Legacy Technology Debt", body: "Qvidian was built in the early 2000s and acquired by Upland Software. While it's been updated over the years, its architecture reflects a pre-cloud, pre-AI era. OptiRFP is built from the ground up with modern AI, cloud infrastructure, and real-time collaboration." },
          { title: "8–12 Weeks of Implementation", body: "Qvidian implementations typically take 8–12 weeks including content library migration, user training, and IT integration. OptiRFP requires zero implementation — sign up, upload an RFP, and get AI-powered analysis in minutes." },
          { title: "No More Multi-Year Contracts", body: "Qvidian locks you into multi-year enterprise contracts starting at $30,000+/year. OptiRFP offers month-to-month pricing starting free, with paid plans from $199/month. Cancel anytime — no penalties, no negotiations." },
          { title: "Why Teams Migrate from Qvidian", body: "Teams leave Qvidian for OptiRFP's modern AI capabilities, transparent pricing, and zero-friction onboarding. The free tier with 6 projects per year lets you prove value before committing any budget." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Ready to modernize your RFP workflow?</p>
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

export default CompareQvidian;
