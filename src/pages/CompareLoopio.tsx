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
  { feature: "Starting Price", optirfp: "Free / $199/mo", competitor: "$20,000+/year", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "No free plan", winner: "optirfp" },
  { feature: "AI Capabilities", optirfp: "AI-native: analysis, drafting, evaluation", competitor: "Legacy content library with basic automation", winner: "optirfp" },
  { feature: "Ease of Use", optirfp: "Upload & go — proposals in minutes", competitor: "Weeks of onboarding & training", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "4–8 weeks implementation", winner: "optirfp" },
  { feature: "Support", optirfp: "Email + docs + community", competitor: "Enterprise support (paid)", winner: "tie" },
];

const CompareLoopio = () => {
  const [signupOpen, setSignupOpen] = useState(false);



  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO {...SEO_CONFIG.compareLoopio} />
      <CompareNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">Loopio</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            The Modern AI Alternative to Loopio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Stop paying enterprise prices for a content library. Get AI-powered proposal generation that actually writes your responses.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Start free vs $20K minimum" },
              { label: "6 projects free vs no free plan" },
              { label: "AI-native vs legacy library" },
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

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-bold mb-8 text-center">Feature-by-Feature Comparison</h2>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-1/3">Feature</TableHead>
                <TableHead className="w-1/3 text-primary font-bold">OptiRFP</TableHead>
                <TableHead className="w-1/3">Loopio</TableHead>
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

      {/* Detail Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-12 w-full">
        {[
          { title: "Pricing That Makes Sense", body: "Loopio requires a minimum $20,000/year commitment with lengthy contracts. OptiRFP starts free with 6 projects per year, and paid plans begin at $199/month — cancel anytime." },
          { title: "Ease of Use", body: "Loopio requires weeks of onboarding, content library setup, and training. OptiRFP lets you upload an RFP and get a complete analysis in minutes — no setup required." },
          { title: "AI-Native, Not Bolted On", body: "While Loopio added AI features to its legacy content library, OptiRFP was built from the ground up with AI at its core. Every feature — from RFP analysis to proposal drafting — is powered by modern AI." },
          { title: "Why Teams Switch from Loopio", body: "Teams switch to OptiRFP for transparent pricing, faster setup, and AI that actually drafts proposals instead of just searching a content library. The free tier with 6 projects per year lets you evaluate without risk." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Ready to try the modern alternative?</p>
          <Button onClick={() => setSignupOpen(true)}>
            Start Free — No Credit Card <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Signup Dialog */}
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

export default CompareLoopio;
