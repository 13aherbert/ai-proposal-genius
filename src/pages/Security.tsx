import { Shield, Lock, Server, Users, FileCheck, Mail, CheckCircle2, Globe, KeyRound, ArrowRight, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const trustBadges = [
  { icon: Shield, label: "SOC 2 Type II" },
  { icon: Globe, label: "FedRAMP Authorized" },
  { icon: Lock, label: "AES-256 Encryption" },
];

const sections = [
  {
    title: "Data Encryption",
    icon: Lock,
    items: [
      { label: "AES-256 encryption at rest", detail: "All stored data is encrypted using AES-256-GCM, the same standard used by financial institutions and government agencies." },
      { label: "TLS 1.3 in transit", detail: "Every connection uses TLS 1.3 with perfect forward secrecy — no data ever travels unencrypted." },
      { label: "End-to-end encrypted storage", detail: "Documents, proposals, and knowledge base entries are encrypted before they reach our storage layer." },
    ],
  },
  {
    title: "Compliance",
    icon: FileCheck,
    items: [
      { label: "SOC 2 Type II certified", detail: "Independently audited controls for security, availability, and confidentiality." },
      { label: "FedRAMP authorized", detail: "Meets the rigorous security requirements for U.S. federal government cloud services." },
      { label: "GDPR compliant", detail: "Full compliance with EU data protection regulations, including data export and deletion rights." },
      { label: "CCPA compliant", detail: "California Consumer Privacy Act protections for all users, regardless of location." },
    ],
  },
  {
    title: "Infrastructure",
    icon: Server,
    items: [
      { label: "AWS hosting (US-based)", detail: "Deployed across multiple AWS availability zones in the United States for redundancy and low latency." },
      { label: "99.9% uptime SLA", detail: "Contractual uptime guarantee backed by automated failover and health monitoring." },
      { label: "Automated backups", detail: "Point-in-time recovery with encrypted backups retained for 30 days." },
    ],
  },
  {
    title: "Access Controls",
    icon: Users,
    items: [
      { label: "Role-based permissions", detail: "Granular RBAC lets admins control who can view, edit, and manage projects and settings." },
      { label: "SSO / SAML support", detail: "Enterprise plans include SAML 2.0 single sign-on with Okta, Azure AD, Google Workspace, and more." },
      { label: "2FA / MFA available", detail: "Multi-factor authentication adds a second layer of protection to every account." },
    ],
  },
];

const complianceDocs = [
  { title: "SOC 2 Type II Report", description: "Request our latest SOC 2 Type II audit report under NDA.", cta: "Request Report", gated: true },
  { title: "Penetration Testing", description: "Annual third-party penetration tests by independent security firms. Summary available on request.", cta: "Learn More", gated: true },
  { title: "Privacy Policy", description: "Read our full data privacy and protection policy.", cta: "Contact Us", gated: true },
];

const ease = [0.16, 1, 0.3, 1];

export default function SecurityPage() {
  useSEO({
    title: "Security & Compliance — OptiRFP",
    description: "Enterprise-grade security for your RFP workflow. SOC 2 Type II, FedRAMP, AES-256 encryption, SSO/SAML, and GDPR compliance.",
    canonical: "/security",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "OptiRFP Security & Compliance",
      description: "Enterprise-grade security measures protecting your RFP data.",
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container max-w-5xl mx-auto px-4 py-24 md:py-32 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease }}
          >
            <Badge variant="outline" className="mb-6 text-xs tracking-wide uppercase px-3 py-1 border-primary/30 text-primary">
              Security & Compliance
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-balance">
              Enterprise-Grade Security
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Your data is protected by industry-leading security measures, continuous auditing, and strict access controls.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
          >
            {trustBadges.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-foreground shadow-sm"
              >
                <b.icon className="h-4 w-4 text-primary" />
                {b.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Highlights */}
      <section className="container max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="grid gap-8 md:grid-cols-2">
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: si * 0.08, ease }}
            >
              <Card className="h-full border-border/50 bg-card/80 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  </div>
                  <ul className="space-y-4">
                    {section.items.map((item) => (
                      <li key={item.label} className="flex gap-3">
                        <CheckCircle2 className="h-4 w-4 mt-1 shrink-0 text-primary/70" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance Documentation */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container max-w-5xl mx-auto px-4 py-20 md:py-28">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease }}
          >
            <h2 className="text-3xl font-bold tracking-tight">Compliance Documentation</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Access our audit reports, penetration testing results, and privacy policies.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {complianceDocs.map((doc, di) => (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: di * 0.08, ease }}
              >
                <Card className="h-full border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">{doc.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{doc.description}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => window.open("mailto:security@optirfp.ai?subject=" + encodeURIComponent(doc.title + " Request"))}
                      >
                        {doc.cta} <ArrowRight className="ml-1.5 h-3 w-3" />
                      </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="border-t border-border/40">
        <div className="container max-w-3xl mx-auto px-4 py-20 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease }}
          >
            <Shield className="h-10 w-10 mx-auto text-primary/80 mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Questions about security?</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Our security team is ready to answer questions, provide documentation, or schedule a review.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => window.open("mailto:security@optirfp.ai?subject=Security Inquiry")}
              >
                <Mail className="mr-2 h-4 w-4" />
                security@optirfp.ai
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/faq">View FAQ <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
