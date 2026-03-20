
import { Calendar, Clock, Users, Shield, Play, CheckCircle2, ArrowRight, Presentation, Target, Handshake, Mail, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const expectations = [
  { icon: Clock, title: "30-Minute Session", desc: "A focused, personalized walkthrough tailored to your workflow — no fluff." },
  { icon: Presentation, title: "Live Product Demo", desc: "See real RFP analysis, proposal generation, and collaboration in action." },
  { icon: Target, title: "Custom Pricing", desc: "We'll build a plan around your team size, volume, and feature needs." },
  { icon: Handshake, title: "Zero Commitment", desc: "No contracts, no pressure. Just a conversation about what OptiRFP can do for you." },
];

const agenda = [
  { step: "01", title: "AI RFP Analysis", desc: "Upload a sample RFP and watch our AI extract requirements, deadlines, and evaluation criteria in seconds." },
  { step: "02", title: "Proposal Generation", desc: "See how OptiRFP drafts compliant, on-brand proposals using your knowledge base and past wins." },
  { step: "03", title: "Team Collaboration", desc: "Assign sections, track progress, and manage reviews — all from a single dashboard." },
  { step: "04", title: "Security Overview", desc: "SOC 2 Type II, AES-256 encryption, SSO/SAML — we'll cover how your data stays protected." },
];

const attendees = [
  { icon: UserCheck, role: "Proposal Managers", reason: "Streamline your entire response workflow" },
  { icon: Building2, role: "Sales Operations", reason: "Increase win rates with faster, smarter proposals" },
  { icon: Target, role: "Business Development", reason: "Respond to more opportunities without scaling headcount" },
];

const ease = [0.16, 1, 0.3, 1];

export default function Demo() {
  useSEO({
    title: "Book a Demo — OptiRFP",
    description: "See OptiRFP in action. Book a personalized 30-minute demo with our team and learn how AI-powered RFP analysis can transform your proposal workflow.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Book a Demo — OptiRFP",
      description: "Schedule a personalized demo of OptiRFP's AI-powered RFP response platform.",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(160,15%,8%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(160,40%,18%,0.35),transparent)]" />
        <div className="container relative mx-auto max-w-5xl px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
            <Badge variant="outline" className="mb-6 border-brand-green/40 text-brand-green bg-brand-green/10 text-xs tracking-wide">
              <Calendar className="mr-1.5 h-3 w-3" /> Free 30-Minute Demo
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              See OptiRFP in Action
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 text-pretty">
              Get a personalized walkthrough with our team — we'll show you exactly how AI‑powered RFP analysis fits your workflow.
            </p>
          </motion.div>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
          >
            <Button size="lg" className="text-base px-8" asChild>
              <a href="#book">Book Your Demo <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
              <a href="https://www.youtube.com/@optirfp" target="_blank" rel="noopener noreferrer">
                <Play className="mr-2 h-4 w-4" /> Watch Overview
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">What to Expect</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">A straightforward session built around your goals — not a sales pitch.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {expectations.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease }}
              >
                <Card className="h-full border-border/60 bg-card hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-brand-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="book" className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Book Your Demo</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Pick a time that works for you — we'll handle the rest.</p>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease }}
          >
            {/* TidyCal embed placeholder — replace the src with your actual TidyCal booking URL */}
            <div className="w-full min-h-[600px] flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <Calendar className="h-12 w-12 text-brand-green mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Schedule Your Demo</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Our TidyCal booking widget will appear here once connected. In the meantime, you can book directly:
                </p>
                <Button size="lg" asChild>
                  <a href="mailto:sales@optirfp.ai?subject=Demo%20Request&body=Hi%2C%20I'd%20like%20to%20schedule%20a%20demo%20of%20OptiRFP.%0A%0AName%3A%20%0ACompany%3A%20%0ATeam%20Size%3A%20%0APlan%20Interest%3A%20">
                    <Mail className="mr-2 h-4 w-4" /> Request a Demo
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  To embed TidyCal, replace this section with:
                  <code className="block mt-1 bg-muted rounded px-2 py-1 text-[11px]">
                    {'<iframe src="https://tidycal.com/your-link" width="100%" height="600" />'}
                  </code>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo Agenda */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Demo Agenda</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Here's what we'll cover in your 30-minute session.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
            {agenda.map((item, i) => (
              <motion.div
                key={item.step}
                className="flex gap-5"
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.09, ease }}
              >
                <span className="flex-shrink-0 text-3xl font-bold text-brand-green/30 tabular-nums select-none leading-none pt-1">{item.step}</span>
                <div>
                  <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Attend */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Who Should Attend</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">This demo is built for the people who live and breathe proposals.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {attendees.map((a, i) => (
              <motion.div
                key={a.role}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease }}
              >
                <Card className="h-full text-center border-border/60 bg-card hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
                      <a.icon className="h-6 w-6 text-brand-green" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{a.role}</h3>
                    <p className="text-sm text-muted-foreground">{a.reason}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-[hsl(160,15%,8%)] text-white">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to Transform Your RFP Process?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Join hundreds of teams that have cut proposal turnaround time by more than half.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8" asChild>
                <a href="#book">Book Your Demo <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link to="/security">
                  <Shield className="mr-2 h-4 w-4" /> Security & Compliance
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
