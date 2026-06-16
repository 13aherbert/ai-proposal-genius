import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const CANONICAL = "https://optirfp.ai/resources/rfp-response-template";

interface Section {
  name: string;
  purpose: string;
  whatToInclude: string[];
  tip: string;
}

const SECTIONS: Section[] = [
  {
    name: "1. Cover letter",
    purpose: "Personally address the buyer and signal you understand their goal.",
    whatToInclude: [
      "Buyer name, RFP title, and reference number",
      "One sentence on why you're a strong fit",
      "Primary point of contact (name, title, email, phone)",
      "Signature from a senior executive",
    ],
    tip: "Keep it to one page. The evaluator skims it before opening anything else.",
  },
  {
    name: "2. Executive summary",
    purpose: "Give a scorer who reads nothing else enough to advocate for you.",
    whatToInclude: [
      "Restated understanding of the buyer's problem",
      "Your proposed approach in 3–5 bullets",
      "Three measurable outcomes the buyer can expect",
      "Why your team is uniquely qualified",
    ],
    tip: "Write this last. It should mirror the evaluation criteria, in their order.",
  },
  {
    name: "3. Company profile",
    purpose: "Establish credibility without becoming an 'about us' brochure.",
    whatToInclude: [
      "Years in business, size, geographic reach",
      "Relevant certifications (SOC 2, ISO 27001, set-aside status)",
      "Three customer logos in the buyer's industry",
      "One paragraph on financial stability",
    ],
    tip: "Cut anything that isn't directly relevant to this RFP. Padding hurts your score.",
  },
  {
    name: "4. Understanding of requirements",
    purpose: "Prove you read the RFP carefully — the single best trust signal.",
    whatToInclude: [
      "Restated scope in your own words",
      "Key constraints, dependencies, and assumptions",
      "Risks you've identified and how you'll mitigate them",
    ],
    tip: "Use the buyer's own terminology. Mirroring language signals comprehension.",
  },
  {
    name: "5. Proposed solution / technical approach",
    purpose: "The heart of the proposal — show how you'll actually deliver.",
    whatToInclude: [
      "Methodology, phased plan, and major deliverables",
      "Architecture or workflow diagrams where helpful",
      "Integration, security, and compliance details",
      "How you'll measure success",
    ],
    tip: "Headings should track the RFP's requirements list. Make scoring effortless.",
  },
  {
    name: "6. Project plan and timeline",
    purpose: "Demonstrate you can deliver on the buyer's schedule.",
    whatToInclude: [
      "Phased schedule with milestones",
      "Resource ramp-up plan",
      "Buyer-side responsibilities and dependencies",
      "Status reporting cadence",
    ],
    tip: "A Gantt-style visual is worth a page of prose. Include one.",
  },
  {
    name: "7. Team and qualifications",
    purpose: "Show the named humans who will do the work.",
    whatToInclude: [
      "Org chart with roles and reporting lines",
      "Short bios for key personnel with relevant projects",
      "Resumes in an appendix",
      "Subcontractor or partner roles (if any)",
    ],
    tip: "Generic bios lose. Anchor each one to a project similar to this RFP.",
  },
  {
    name: "8. Past performance and references",
    purpose: "Prove you've done this before — for a comparable customer.",
    whatToInclude: [
      "3–5 case studies with quantified outcomes",
      "Reference contacts (with permission)",
      "Anything matching the buyer's industry, scale, or compliance regime",
    ],
    tip: "One case study at the buyer's scale beats five generic ones.",
  },
  {
    name: "9. Pricing",
    purpose: "Make pricing easy to compare and tie it back to value.",
    whatToInclude: [
      "The buyer's pricing table, completed as-is",
      "Assumptions and exclusions",
      "Optional add-ons or alternate pricing models",
      "Payment terms and discount structure",
    ],
    tip: "Don't rewrite the buyer's pricing table. They scripted it for a reason.",
  },
  {
    name: "10. Compliance matrix",
    purpose: "Confirm every requirement is addressed.",
    whatToInclude: [
      "Requirement ID and source page",
      "Compliance status (Comply / Partial / Exception)",
      "Cross-reference to the response section that proves it",
    ],
    tip: "If the RFP doesn't ask for one, include it anyway. Evaluators love them.",
  },
  {
    name: "11. Appendices",
    purpose: "Park supporting material out of the main narrative.",
    whatToInclude: [
      "Resumes",
      "Certifications and insurance",
      "Sample reports or screenshots",
      "Master Services Agreement redlines (if requested)",
    ],
    tip: "Anything in an appendix should be referenced from the main response.",
  },
];

export default function RfpResponseTemplate() {
  const schema = [
    {
      "@type": "Article",
      headline: "RFP Response Template: 11-Section Framework for Winning Proposals",
      description:
        "A free RFP response template with 11 proven sections — cover letter through compliance matrix — plus a section-by-section guide to what evaluators look for.",
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
        title="RFP Response Template: 11-Section Framework for Winning Proposals"
        description="A free RFP response template with 11 proven sections — cover letter through compliance matrix — plus a section-by-section guide to what evaluators look for."
        canonical={CANONICAL}
        ogType="article"
        schema={schema}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-medium text-primary mb-3">Resources / Template</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            RFP Response Template
          </h1>
          <p className="text-lg text-muted-foreground">
            An 11-section template you can use for any RFP response, with notes on what to put
            in each section and what evaluators actually score. Adapt it to the structure the
            buyer specifies — always defer to their format if they give you one.
          </p>
        </header>

        <Card className="mb-10 border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Skip the template — auto-generate a response</h2>
              <p className="text-sm text-muted-foreground">
                Upload your RFP to OptiRFP and we'll draft all 11 sections from your knowledge base.
              </p>
            </div>
            <Button size="lg" asChild className="shrink-0">
              <Link to="/auth?mode=signup">
                Try OptiRFP free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <nav aria-label="Template sections" className="mb-12 rounded-lg border bg-muted/30 p-5">
          <p className="text-sm font-semibold mb-3">Template sections</p>
          <ol className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {SECTIONS.map((s, i) => (
              <li key={s.name}>
                <a href={`#section-${i + 1}`} className="text-primary hover:underline">
                  {s.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-8">
          {SECTIONS.map((s, i) => (
            <section key={s.name} id={`section-${i + 1}`}>
              <h2 className="text-2xl font-bold mb-2">{s.name}</h2>
              <p className="text-muted-foreground mb-4">{s.purpose}</p>
              <div className="rounded-lg border p-5 bg-card">
                <p className="text-sm font-semibold mb-3">What to include</p>
                <ul className="space-y-2 mb-5">
                  {s.whatToInclude.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md bg-muted/50 px-4 py-3 text-sm">
                  <strong className="text-foreground">Tip: </strong>
                  <span className="text-muted-foreground">{s.tip}</span>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 prose prose-lg dark:prose-invert max-w-none">
          <h2>Before you submit: a final checklist</h2>
          <ul>
            <li>Every requirement in the RFP appears in your compliance matrix.</li>
            <li>Section order and naming match what the buyer asked for.</li>
            <li>Page limits, font, and margins meet the submission rules exactly.</li>
            <li>Pricing table is the buyer's, not yours, and is fully filled in.</li>
            <li>All hyperlinks resolve and all referenced appendices are attached.</li>
            <li>The file is submitted in the format requested (PDF, DOCX, portal upload).</li>
          </ul>
          <p>
            Want a worked example to compare against? See our{" "}
            <Link to="/resources/rfp-examples">RFP examples by industry</Link> or start from{" "}
            <Link to="/resources/what-is-an-rfp">what an RFP is</Link> if you're new to the
            process.
          </p>
        </section>

        <div className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Draft a tailored response in minutes</h2>
          <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
            OptiRFP fills every section of this template from your knowledge base, mapped to the
            evaluation criteria of the RFP you upload.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth?mode=signup">Start free with OptiRFP</Link>
          </Button>
        </div>
      </article>
    </>
  );
}
