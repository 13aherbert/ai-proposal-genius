
import { ArrowRight, Mail, Code2, Puzzle, CheckCircle2, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { TierBadge } from "@/components/subscription/TierBadge";
import { GatedFeatureModal } from "@/components/subscription/GatedFeatureModal";

const ease = [0.16, 1, 0.3, 1];

type Status = "available" | "coming_soon" | "request";
type Tier = "All Plans" | "Business+" | "Enterprise";

interface Integration {
  name: string;
  desc: string;
  logo: string;
  status: Status;
  tier: Tier;
}

const statusConfig: Record<Status, { label: string; icon: typeof CheckCircle2; className: string }> = {
  available: { label: "Available", icon: CheckCircle2, className: "border-brand-green/40 text-brand-green bg-brand-green/10" },
  coming_soon: { label: "Coming Soon", icon: Clock, className: "border-amber-400/40 text-amber-400 bg-amber-400/10" },
  request: { label: "Request Access", icon: Lock, className: "border-blue-400/40 text-blue-400 bg-blue-400/10" },
};

const categories: { title: string; items: Integration[] }[] = [
  {
    title: "CRM",
    items: [
      { name: "Salesforce", desc: "Sync proposals and deals with your Salesforce CRM.", logo: "🔵", status: "available", tier: "Enterprise" },
      { name: "HubSpot", desc: "Push won proposals to HubSpot Deals automatically.", logo: "🟠", status: "available", tier: "Enterprise" },
    ],
  },
  {
    title: "Storage",
    items: [
      { name: "Google Drive", desc: "Import RFPs and export proposals directly from Drive.", logo: "📁", status: "available", tier: "All Plans" },
      { name: "Dropbox", desc: "Access and save documents in your Dropbox workspace.", logo: "📦", status: "available", tier: "All Plans" },
      { name: "OneDrive", desc: "Connect your Microsoft OneDrive for seamless file management.", logo: "☁️", status: "coming_soon", tier: "All Plans" },
    ],
  },
  {
    title: "Collaboration",
    items: [
      { name: "Slack", desc: "Get proposal updates and notifications in Slack channels.", logo: "💬", status: "available", tier: "Business+" },
      { name: "Microsoft Teams", desc: "Collaborate on proposals within Microsoft Teams.", logo: "🟣", status: "coming_soon", tier: "Business+" },
    ],
  },
  {
    title: "SSO / Identity",
    items: [
      { name: "Okta", desc: "Enterprise single sign-on via SAML 2.0 with Okta.", logo: "🔐", status: "available", tier: "Enterprise" },
      { name: "Azure AD", desc: "Authenticate with Microsoft Azure Active Directory.", logo: "🔷", status: "available", tier: "Enterprise" },
      { name: "Google Workspace", desc: "SSO with your Google Workspace organization.", logo: "🟡", status: "available", tier: "Enterprise" },
    ],
  },
];

function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-[11px] ${cfg.className}`}>
      <Icon className="mr-1 h-3 w-3" /> {cfg.label}
    </Badge>
  );
}

const TIER_ORDER: Record<string, number> = {
  starter: 0, growth: 1, business: 2, enterprise: 3,
};

function tierToRequired(tier: Tier): 'growth' | 'business' | 'enterprise' | null {
  switch (tier) {
    case "Business+": return "business";
    case "Enterprise": return "enterprise";
    default: return null;
  }
}

export default function Integrations() {
  const { plan } = useSubscriptionFeatures();
  const [gateModal, setGateModal] = useState<{ open: boolean; name: string; tier: 'growth' | 'business' | 'enterprise' }>({
    open: false, name: "", tier: "business",
  });

  const currentLevel = TIER_ORDER[plan] ?? 0;

  useSEO({
    title: "Integrations — OptiRFP",
    description: "Connect OptiRFP with Salesforce, HubSpot, Slack, Google Drive, Okta, and more. Explore available integrations and build custom ones with our API.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Integrations — OptiRFP",
      description: "Browse OptiRFP's integration directory.",
    },
  });

  const handleConnect = (item: Integration) => {
    const required = tierToRequired(item.tier);
    if (required && currentLevel < (TIER_ORDER[required] ?? 99)) {
      setGateModal({ open: true, name: item.name, tier: required });
    } else {
      // Actual connect logic would go here
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[hsl(160,15%,8%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(160,40%,18%,0.35),transparent)]" />
        <div className="container relative mx-auto max-w-5xl px-6 py-24 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease }}>
            <Badge variant="outline" className="mb-6 border-brand-green/40 text-brand-green bg-brand-green/10 text-xs tracking-wide">
              <Puzzle className="mr-1.5 h-3 w-3" /> Ecosystem
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              Integrations
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto text-pretty">
              Connect OptiRFP with the tools your team already uses — from CRMs to cloud storage to SSO providers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.map((cat, ci) => (
        <section key={cat.title} className={ci % 2 === 0 ? "py-16 md:py-24 bg-background" : "py-16 md:py-24 bg-muted/40"}>
          <div className="container mx-auto max-w-5xl px-6">
            <motion.h2
              className="text-2xl md:text-3xl font-bold tracking-tight mb-8"
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease }}
            >
              {cat.title}
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.items.map((item, i) => {
                const requiredTier = tierToRequired(item.tier);
                const isLocked = requiredTier ? currentLevel < (TIER_ORDER[requiredTier] ?? 99) : false;

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease }}
                  >
                    <Card className="h-full border-border/60 bg-card hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl select-none" role="img" aria-label={item.name}>{item.logo}</span>
                            <h3 className="font-semibold text-base">{item.name}</h3>
                          </div>
                          {isLocked && requiredTier && (
                            <TierBadge tier={requiredTier} size="sm" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.status} />
                          {item.status === "available" && (
                            <Button
                              size="sm"
                              variant={isLocked ? "outline" : "default"}
                              onClick={() => handleConnect(item)}
                              className="ml-auto"
                            >
                              {isLocked && <Lock className="h-3 w-3 mr-1" />}
                              Connect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Custom Integrations + API */}
      <section className="py-20 md:py-28 bg-[hsl(160,15%,8%)] text-white">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="p-8">
                  <Puzzle className="h-10 w-10 text-brand-green mb-4" />
                  <h3 className="text-xl font-bold mb-2">Custom Integrations</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    Need a specific integration that isn't listed? Our Enterprise team can build custom connectors tailored to your stack.
                  </p>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                    <a href="mailto:enterprise@optirfp.ai?subject=Custom%20Integration%20Request">
                      <Mail className="mr-2 h-4 w-4" /> Contact Enterprise Sales
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.08, ease }}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="p-8">
                  <Code2 className="h-10 w-10 text-brand-green mb-4" />
                  <h3 className="text-xl font-bold mb-2">API Access</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    Build your own integrations with full REST API access. Enterprise customers get authenticated endpoints, webhook support, and dedicated rate limits.
                  </p>
                  <Button asChild>
                    <Link to="/api-docs">
                      Explore API Docs <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gated Feature Modal */}
      <GatedFeatureModal
        open={gateModal.open}
        onOpenChange={(open) => setGateModal(prev => ({ ...prev, open }))}
        featureName={`${gateModal.name} Integration`}
        requiredTier={gateModal.tier}
        description="Connect your favorite tools with OptiRFP to streamline your proposal workflow and boost productivity."
        benefits={[
          "Sync opportunities from Salesforce CRM",
          "Get Slack/Teams notifications for project updates",
          "Export directly to Google Drive or SharePoint",
          "Automate your proposal workflow across tools",
        ]}
      />
    </div>
  );
}
