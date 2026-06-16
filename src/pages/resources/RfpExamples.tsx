import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CANONICAL = "https://optirfp.ai/resources/rfp-examples";

interface Example {
  title: string;
  industry: string;
  issuer: string;
  scope: string;
  whatItDoesWell: string;
  watchOuts: string;
}

const EXAMPLES: Example[] = [
  {
    title: "Enterprise SaaS implementation RFP",
    industry: "Information Technology",
    issuer: "Mid-market financial services firm",
    scope: "Replace a legacy CRM with a SaaS platform, including data migration, integrations to two ERPs, training for 400 users, and a 12-month support contract.",
    whatItDoesWell: "Lists evaluation weightings (Technical 40%, Implementation 25%, Pricing 20%, References 15%) so vendors know where to invest writing effort.",
    watchOuts: "Vague SLA language. Ask clarifying questions about uptime targets and credits before quoting.",
  },
  {
    title: "Cybersecurity managed services RFP",
    industry: "Information Technology",
    issuer: "Regional healthcare system",
    scope: "24x7 SOC, incident response retainer, vulnerability scanning, and HIPAA-aligned reporting across 18 sites.",
    whatItDoesWell: "Includes a detailed compliance matrix template vendors must complete line by line — easy to score, hard to fake.",
    watchOuts: "Heavy on certifications (SOC 2, HITRUST). If you don't already hold them, the bid is probably a no-go.",
  },
  {
    title: "School district construction RFP",
    industry: "Construction",
    issuer: "Public school district",
    scope: "Design-build of a 45,000 sq ft elementary school, including site work, LEED Silver target, and a 24-month delivery window.",
    whatItDoesWell: "Mandatory pre-bid site walk and Q&A period. Establishes a level playing field and surfaces site-specific risks early.",
    watchOuts: "Bid bonds and performance bonds required. Factor bonding capacity into your go/no-go decision.",
  },
  {
    title: "Marketing agency of record RFP",
    industry: "Marketing & Creative",
    issuer: "Consumer-products brand",
    scope: "Brand strategy, paid media planning and buying, content production, and quarterly analytics for a $4M annual marketing budget.",
    whatItDoesWell: "Asks for a sample 90-day plan, not just credentials. Forces vendors to demonstrate thinking, not just past work.",
    watchOuts: "Open-ended creative ask with no compensation. Decide if speculative work is worth the time investment.",
  },
  {
    title: "Federal IT services RFP",
    industry: "Government — Federal",
    issuer: "U.S. federal agency (GSA Schedule)",
    scope: "Application development and modernization task order under an existing IDIQ vehicle, 5-year period of performance.",
    whatItDoesWell: "Provides a detailed Section L (instructions) and Section M (evaluation) — the gold standard for clarity.",
    watchOuts: "Strict page limits, font sizes, and margins. Non-conforming proposals are eliminated without review.",
  },
  {
    title: "State government cloud migration RFP",
    industry: "Government — State & Local",
    issuer: "State Department of Technology",
    scope: "Lift-and-shift of 60 legacy workloads to a public cloud, plus a 24-month managed services contract.",
    whatItDoesWell: "Mandatory cost-realism analysis. Forces vendors to justify pricing, which protects against underbidding.",
    watchOuts: "In-state vendor preference and small business set-aside considerations. Partner strategy may matter.",
  },
  {
    title: "Higher-education learning management system RFP",
    industry: "Education",
    issuer: "Multi-campus university system",
    scope: "Replacement LMS for 80,000 students and 6,000 faculty, including SSO, accessibility (WCAG 2.1 AA), and integration with the existing SIS.",
    whatItDoesWell: "Demo scenarios are scripted and identical for all finalists. Removes 'best demo' bias from scoring.",
    watchOuts: "Heavy accessibility documentation requirements. VPATs and WCAG audit reports take real time to prepare.",
  },
  {
    title: "Nonprofit fundraising platform RFP",
    industry: "Nonprofit",
    issuer: "National nonprofit",
    scope: "CRM, donor portal, recurring giving, peer-to-peer fundraising, and email automation for 250,000 supporters.",
    whatItDoesWell: "Asks for total cost of ownership over 3 years, not just year-one license fees. Honest comparison across vendors.",
    watchOuts: "Tight implementation timeline (90 days). Confirm staffing availability before committing.",
  },
];

export default function RfpExamples() {
  const schema = [
    {
      "@type": "Article",
      headline: "RFP Examples: 8 Real-World Request for Proposal Samples by Industry",
      description:
        "Annotated RFP examples across IT, construction, marketing, government, education, and nonprofit. See what each does well and where to watch out.",
      mainEntityOfPage: CANONICAL,
      author: { "@type": "Organization", name: "OptiRFP" },
      publisher: { "@type": "Organization", name: "OptiRFP" },
      datePublished: "2026-06-16",
      dateModified: "2026-06-16",
    },
  ];

  return (
    <>
      <SEO
        title="RFP Examples: 8 Real-World Request for Proposal Samples by Industry"
        description="Annotated RFP examples across IT, construction, marketing, government, education, and nonprofit. See what each does well and where to watch out."
        canonical={CANONICAL}
        ogType="article"
        schema={schema}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-medium text-primary mb-3">Resources / Examples</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            RFP Examples by Industry
          </h1>
          <p className="text-lg text-muted-foreground">
            Eight representative Request for Proposal examples drawn from real procurements,
            with notes on what each does well and where vendors most often get tripped up.
            Use them to calibrate your own bids — or to write better RFPs.
          </p>
        </header>

        <div className="mb-10 rounded-lg border bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">New to RFPs?</strong> Start with our plain-English{" "}
            <Link to="/resources/what-is-an-rfp" className="text-primary hover:underline">
              guide to what an RFP is
            </Link>{" "}
            and how the process works.
          </p>
        </div>

        <div className="space-y-6">
          {EXAMPLES.map((ex, idx) => (
            <Card key={ex.title} className="overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Example {idx + 1}</p>
                    <h2 className="text-xl sm:text-2xl font-bold">{ex.title}</h2>
                  </div>
                  <Badge variant="secondary">{ex.industry}</Badge>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold text-foreground mb-1">Typical issuer</dt>
                    <dd className="text-muted-foreground">{ex.issuer}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">Scope</dt>
                    <dd className="text-muted-foreground">{ex.scope}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">What this RFP does well</dt>
                    <dd className="text-muted-foreground">{ex.whatItDoesWell}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">Watch-outs for bidders</dt>
                    <dd className="text-muted-foreground">{ex.watchOuts}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-14 prose prose-lg dark:prose-invert max-w-none">
          <h2>How to use these examples</h2>
          <p>
            Two patterns repeat across every winning response, regardless of industry:
          </p>
          <ol>
            <li>
              <strong>Read evaluation criteria first.</strong> The scoring rubric tells you
              exactly where points are awarded. Match the structure of your response to it.
            </li>
            <li>
              <strong>Map every requirement to a section of your reply.</strong> A compliance
              matrix isn't optional — it's how buyers confirm nothing was missed.
            </li>
          </ol>
          <p>
            Need a starting point? Grab our{" "}
            <Link to="/resources/rfp-response-template">RFP response template</Link>, or upload
            any RFP to OptiRFP and we'll extract the requirements automatically.
          </p>
        </section>

        <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Stop building compliance matrices by hand</h2>
          <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
            Upload your RFP to OptiRFP and get a full requirement extract, scoring rubric, and
            first-draft response in minutes.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?mode=signup">Upload your first RFP free</Link>
          </Button>
        </div>
      </article>
    </>
  );
}
