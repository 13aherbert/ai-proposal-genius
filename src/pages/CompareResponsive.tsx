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
  { feature: "Starting Price", optirfp: "Free / $199/mo", competitor: "$15,000+/year", winner: "optirfp" },
  { feature: "Pricing Model", optirfp: "Flat rate — unlimited users", competitor: "Per-seat pricing", winner: "optirfp" },
  { feature: "Free Tier", optirfp: "6 projects free per year", competitor: "No free plan", winner: "optirfp" },
  { feature: "AI Capabilities", optirfp: "AI-native: analysis, drafting, evaluation", competitor: "Content library search with basic automation", winner: "optirfp" },
  { feature: "Setup Time", optirfp: "Under 5 minutes", competitor: "6–8 weeks implementation", winner: "optirfp" },
  { feature: "Per-Seat Fees", optirfp: "No — unlimited users on paid plans", competitor: "Yes — cost scales per user", winner: "optirfp" },
  { feature: "Support", optirfp: "Email + docs + community", competitor: "Enterprise support (paid tier)", winner: "tie" },
];

const CompareResponsive = () => {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO {...SEO_CONFIG.compareResponsive} />
      <CompareNav />

      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-3xl md:text-4xl font-bold text-primary">OptiRFP</span>
            <span className="text-2xl md:text-3xl font-light text-muted-foreground">vs</span>
            <span className="text-3xl md:text-4xl font-bold text-muted-foreground">Responsive</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Stop Paying Per Seat for RFP Software
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Responsive (formerly RFPIO) charges per seat and requires months of setup. OptiRFP gives you unlimited users, AI-powered drafting, and a free tier — no sales call required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Free vs $15K+/year" },
              { label: "Flat rate vs per-seat" },
              { label: "AI-native vs content library" },
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
                <TableHead className="w-1/3">Responsive</TableHead>
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
          { title: "The Per-Seat Cost Trap", body: "Responsive charges per user, meaning your costs grow every time you add a team member. A 12-person team could pay over $20,000/year. OptiRFP's Growth plan is $199/month flat — that's $16.50 per user versus $1,667+ per user with Responsive. You save 99% per seat." },
          { title: "Enterprise Complexity You Don't Need", body: "Responsive requires 6–8 weeks of implementation, dedicated onboarding specialists, and content library setup before you can respond to your first RFP. OptiRFP lets you upload an RFP and get AI-powered analysis in under 5 minutes." },
          { title: "Unlimited Users on Every Paid Plan", body: "With OptiRFP, your entire team can collaborate on proposals without worrying about seat limits. Growth ($199/mo), Business ($499/mo), and Enterprise ($1,499+/mo) plans all include unlimited users." },
          { title: "Why Teams Switch from Responsive", body: "Teams switch to OptiRFP to escape per-seat pricing, eliminate lengthy implementation projects, and get AI that actually drafts proposals — not just searches a content library. Start with 6 free projects to see the difference." },
        ].map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur border-t py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <p className="text-sm font-medium hidden sm:block">Ready to drop per-seat pricing?</p>
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

export default CompareResponsive;
