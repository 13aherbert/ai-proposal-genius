import { useState, useMemo } from "react";
import { Search, Mail, ArrowRight, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const faqCategories = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is OptiRFP?",
        a: "OptiRFP is an AI-powered RFP response platform that helps businesses analyze requests for proposals, generate tailored proposal drafts, and manage the entire proposal lifecycle — reducing response time by up to 93%.",
      },
      {
        q: "How does the AI RFP analysis work?",
        a: "Upload your RFP document (PDF, DOC, DOCX, or TXT) and our AI extracts key requirements, deadlines, evaluation criteria, and compliance items. It then generates a structured summary so your team can quickly assess fit and begin drafting.",
      },
      {
        q: "What's included in the free tier?",
        a: "The Starter plan is free forever and includes 6 projects per year, AI RFP Summary, Proposal Outline, and Basic Proposal Draft features. No credit card required to get started.",
      },
      {
        q: "How do I create my first project?",
        a: "After signing up, click \"New Project\" on your dashboard. Upload an RFP document, give the project a name, and OptiRFP will immediately begin analyzing the document and generating an initial summary.",
      },
    ],
  },
  {
    title: "Pricing & Plans",
    items: [
      {
        q: "What's the difference between Starter, Growth, Business, and Enterprise?",
        a: "Starter is free with 6 projects/year. Growth ($199/mo) offers 36 projects/year with enhanced AI and unlimited users. Business ($499/mo) includes 120 projects/year, Proposal Evaluation, API access, and CRM integrations. Enterprise is custom-priced with unlimited everything, SSO, dedicated CSM, and white-label options.",
      },
      {
        q: "Can I upgrade or downgrade my plan?",
        a: "Yes — switch plans at any time from your account settings. Upgrades are prorated for the remainder of your billing cycle. Downgrades take effect at the end of your current billing period.",
      },
      {
        q: "Do you offer annual discounts?",
        a: "Yes! Save 10% with annual billing. Growth drops from $199/mo to $179/mo, and Business drops from $499/mo to $449/mo.",
      },
      {
        q: "What's your refund policy?",
        a: "We offer a 14-day free trial on paid plans — no credit card required. If you cancel within the trial period you won't be charged. After that, subscriptions are non-refundable but you retain access until the end of your billing period.",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        q: "How accurate is the AI proposal generation?",
        a: "Our AI produces high-quality initial drafts by combining industry best practices with the specific requirements extracted from your RFP. All generated content is fully editable so your team retains complete control over the final proposal.",
      },
      {
        q: "Can I edit AI-generated proposals?",
        a: "Absolutely. Every AI-generated section — summaries, outlines, and full drafts — can be reviewed, edited, and refined directly in the platform before exporting.",
      },
      {
        q: "What file formats do you support?",
        a: "OptiRFP accepts PDF, DOC, DOCX, and TXT files for RFP uploads. Proposals can be exported in multiple formats including PDF and DOCX.",
      },
      {
        q: "Is there a limit on team members?",
        a: "The Starter plan is single-user. Growth, Business, and Enterprise plans all support unlimited team members with role-based access control.",
      },
    ],
  },
  {
    title: "Enterprise",
    items: [
      {
        q: "What security certifications do you have?",
        a: "OptiRFP uses enterprise-grade security with data encryption in transit (TLS 1.3) and at rest (AES-256), SOC 2 Type II compliance, and regular third-party penetration testing.",
      },
      {
        q: "Do you offer SSO/SAML?",
        a: "Yes. Enterprise plans include SSO integration with support for SAML 2.0, OAuth, and OIDC providers including Google Workspace, Microsoft Azure AD, Okta, and Auth0.",
      },
      {
        q: "Can we get a dedicated Customer Success Manager?",
        a: "Enterprise customers are assigned a dedicated CSM who handles onboarding, training, quarterly business reviews, and serves as your primary point of contact.",
      },
      {
        q: "Do you support on-premise deployment?",
        a: "OptiRFP is a cloud-native SaaS platform. For organizations with strict data residency requirements, we offer dedicated tenancy with data stored in your preferred region. Contact sales for details.",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        q: "How do I contact support?",
        a: "Email us at support@optirfp.ai. Growth users get standard email support; Business and Enterprise users receive priority support with faster response times.",
      },
      {
        q: "What are your support hours?",
        a: "Standard support operates Monday–Friday, 9 AM–6 PM ET. Enterprise customers with priority support have access to extended hours and faster SLA response times.",
      },
      {
        q: "Do you offer training or onboarding?",
        a: "Yes. All plans include access to our documentation and knowledge base. Business plans include group onboarding sessions, and Enterprise plans include personalized training with your dedicated CSM.",
      },
    ],
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState("");

  useSEO({
    title: "FAQ — OptiRFP | AI-Powered RFP Response Platform",
    description:
      "Find answers to common questions about OptiRFP pricing, features, enterprise capabilities, and support.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqCategories.flatMap((cat) =>
        cat.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        }))
      ),
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return faqCategories;
    const term = search.toLowerCase();
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (i) =>
            i.q.toLowerCase().includes(term) ||
            i.a.toLowerCase().includes(term)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  const totalResults = filtered.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="container relative max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto text-pretty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            Everything you need to know about OptiRFP
          </motion.p>

          {/* Search */}
          <motion.div
            className="relative mt-10 max-w-md mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search frequently asked questions"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container max-w-3xl mx-auto px-4 py-16 space-y-12">
        {search.trim() && (
          <p className="text-sm text-muted-foreground">
            {totalResults} result{totalResults !== 1 && "s"} for "{search}"
          </p>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No questions match your search. Try a different term or{" "}
              <a
                href="mailto:support@optirfp.ai"
                className="text-primary hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        )}

        {filtered.map((category, catIdx) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.55,
              delay: catIdx * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {category.title}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {category.items.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`${catIdx}-${idx}`}
                  className="border border-border rounded-lg px-4 bg-card/50 data-[state=open]:bg-card transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-4 text-[0.95rem]">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <motion.div
          className="container max-w-2xl mx-auto px-4 py-20 text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <MessageCircle className="mx-auto h-8 w-8 text-primary mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Our team is here to help. Reach out and we'll get back to you
            within one business day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <a href="mailto:support@optirfp.ai">
                <Mail className="mr-2 h-4 w-4" />
                support@optirfp.ai
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">
                Back to home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
