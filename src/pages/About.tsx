
import { ArrowRight, Mail, Shield, Zap, Users, Target, Clock, CheckCircle2, Globe, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1];

const values = [
  { icon: Zap, title: "Speed", desc: "Cut proposal turnaround from weeks to hours with AI that works as fast as your deadlines demand." },
  { icon: Target, title: "Accuracy", desc: "Every response is grounded in your knowledge base and past wins — no hallucinations, no guesswork." },
  { icon: Users, title: "Collaboration", desc: "Assign sections, track progress, and review together — all from one dashboard your whole team shares." },
  { icon: Shield, title: "Security", desc: "SOC 2 Type II certified, AES-256 encryption, SSO/SAML — built for the teams that can't afford shortcuts." },
];

const problems = [
  { stat: "20–40 hrs", label: "Average time to respond to a single RFP" },
  { stat: "60%", label: "Of proposal content is rewritten from scratch each time" },
  { stat: "3–5", label: "Team members pulled into every response cycle" },
];

const solution = [
  { icon: Clock, title: "Minutes, Not Weeks", desc: "Upload an RFP and get a structured analysis — requirements, deadlines, and evaluation criteria — in under two minutes." },
  { icon: CheckCircle2, title: "Compliant by Default", desc: "AI-generated proposals pull from your knowledge base, ensuring accuracy and brand consistency across every response." },
  { icon: Shield, title: "Enterprise-Ready", desc: "From encryption at rest to role-based access, OptiRFP meets the security bar your compliance team demands." },
];

export default function About() {
  useSEO({
    title: "About Us — OptiRFP",
    description: "Learn why we built OptiRFP — an AI-powered platform that helps teams respond to RFPs in hours instead of weeks.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About OptiRFP",
      description: "The story behind OptiRFP and our mission to transform how teams respond to RFPs.",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(160,15%,8%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(160,40%,18%,0.35),transparent)]" />
        <div className="container relative mx-auto max-w-5xl px-6 py-24 md:py-36 text-center">
          <motion.div initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
            <Badge variant="outline" className="mb-6 border-brand-green/40 text-brand-green bg-brand-green/10 text-xs tracking-wide">
              Our Story
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              Why We Built OptiRFP
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto text-pretty">
              We watched talented teams burn weeks on proposals that should take hours. So we built something better.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Responding to RFPs shouldn't take weeks of manual effort. We're building the platform that lets teams focus on strategy and relationships — while AI handles the heavy lifting.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease }}
              >
                <Card className="h-full border-border/60 bg-card hover:shadow-md transition-shadow duration-300 text-center">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
                      <v.icon className="h-5 w-5 text-brand-green" />
                    </div>
                    <h3 className="font-semibold text-base mb-1.5">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">The Problem We Solve</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              RFP response is one of the most time-intensive, error-prone processes in B2B — and it hasn't changed in decades.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {problems.map((p, i) => (
              <motion.div
                key={p.stat}
                className="text-center"
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
              >
                <p className="text-4xl md:text-5xl font-bold text-brand-green mb-2">{p.stat}</p>
                <p className="text-sm text-muted-foreground">{p.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.p
            className="text-center text-lg font-medium max-w-xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.25, ease }}
          >
            We built OptiRFP to change that.
          </motion.p>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Our Solution</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              OptiRFP combines AI analysis with your institutional knowledge to deliver proposals that are fast, accurate, and on-brand.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {solution.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
              >
                <Card className="h-full border-border/60 bg-card hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-brand-green/10 flex items-center justify-center mb-4">
                      <s.icon className="h-5 w-5 text-brand-green" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <Globe className="h-10 w-10 text-brand-green mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Remote-First Team</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              We're a distributed team of engineers, designers, and proposal specialists who've lived the RFP pain firsthand. We build OptiRFP from wherever we do our best work.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:hello@optirfp.ai">
                <Mail className="mr-2 h-4 w-4" /> We're hiring — say hello
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <BarChart3 className="h-10 w-10 text-brand-green mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trusted by Growing Teams</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Join the teams that have already cut their proposal turnaround time in half.
            </p>
            <Button size="lg" asChild>
              <Link to="/demo">
                Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 md:py-20 bg-[hsl(160,15%,8%)] text-white">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="flex flex-col sm:flex-row items-center justify-between gap-6" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, ease }}>
            <div>
              <h3 className="text-xl font-bold mb-1">Get in Touch</h3>
              <p className="text-white/60 text-sm">General inquiries or press — we'd love to hear from you.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="mailto:hello@optirfp.ai"><Mail className="mr-1.5 h-3.5 w-3.5" /> hello@optirfp.ai</a>
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="mailto:press@optirfp.ai"><Mail className="mr-1.5 h-3.5 w-3.5" /> press@optirfp.ai</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
