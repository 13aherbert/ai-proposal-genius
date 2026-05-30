import {
  Briefcase, Code2, HardHat, Users, HeartPulse, Landmark,
  Megaphone, Factory, Banknote, MoreHorizontal, type LucideIcon,
} from "lucide-react";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } from "docx";
import { jsPDF } from "jspdf";

export const INDUSTRIES = [
  { id: "it-services", name: "IT Services", icon: Briefcase, blurb: "Managed services, infrastructure, cybersecurity" },
  { id: "software", name: "Software / SaaS", icon: Code2, blurb: "Platforms, integrations, custom development" },
  { id: "construction", name: "Construction", icon: HardHat, blurb: "Design-build, general contracting, civil works" },
  { id: "consulting", name: "Consulting", icon: Users, blurb: "Management, strategy, advisory engagements" },
  { id: "healthcare", name: "Healthcare", icon: HeartPulse, blurb: "Clinical, payer, life-sciences solutions" },
  { id: "government", name: "Government", icon: Landmark, blurb: "Federal, state, local prime & subcontracts" },
  { id: "marketing", name: "Marketing", icon: Megaphone, blurb: "Creative, media, agency-of-record bids" },
  { id: "manufacturing", name: "Manufacturing", icon: Factory, blurb: "Production, supply chain, industrial" },
  { id: "financial", name: "Financial Services", icon: Banknote, blurb: "Banking, insurance, fintech RFPs" },
  { id: "other", name: "Other", icon: MoreHorizontal, blurb: "Generic, sector-neutral language" },
] as const satisfies ReadonlyArray<{ id: string; name: string; icon: LucideIcon; blurb: string }>;

export type IndustryId = typeof INDUSTRIES[number]["id"];

export const SECTIONS = [
  { id: "executive-summary", title: "Executive Summary" },
  { id: "company-overview", title: "Company Overview" },
  { id: "scope", title: "Scope of Work / Technical Approach" },
  { id: "timeline", title: "Project Timeline / Schedule" },
  { id: "pricing", title: "Pricing / Cost Breakdown" },
  { id: "team", title: "Team Qualifications" },
  { id: "past-performance", title: "Past Performance / Case Studies" },
  { id: "risk", title: "Risk Management Plan" },
  { id: "qa", title: "Quality Assurance" },
  { id: "compliance", title: "Compliance Statement" },
] as const;

export type SectionId = typeof SECTIONS[number]["id"];

export const DEFAULT_SECTIONS: SectionId[] = [
  "executive-summary", "company-overview", "scope", "timeline", "pricing", "team",
];

function industryLabel(industry: IndustryId | null): string {
  if (!industry) return "your industry";
  return INDUSTRIES.find((i) => i.id === industry)?.name.toLowerCase() ?? "your industry";
}

export function industryName(industry: IndustryId | null): string {
  return industry ? INDUSTRIES.find((i) => i.id === industry)!.name : "All industries";
}

export function sectionBody(section: SectionId, industry: IndustryId | null): { guidance: string; placeholder: string } {
  const ind = industryLabel(industry);
  switch (section) {
    case "executive-summary":
      return {
        guidance: "Open with the evaluator's problem in their own words, then state your solution and the top 2–3 outcomes you'll deliver. Keep to one page.",
        placeholder: `[Your company] proposes a ${ind} solution that directly addresses the requirements outlined in this RFP. Our approach delivers [primary outcome], [secondary outcome] and measurable [metric] within the stated timeline. This summary previews the detailed approach, team and pricing in the sections that follow.`,
      };
    case "company-overview":
      return {
        guidance: "Year founded, size, locations, relevant certifications, and one sentence on why your firm exists.",
        placeholder: `Founded in [YYYY], [Your company] is a [size] ${ind} firm headquartered in [city]. We hold [certifications/clearances] and have delivered [#] engagements of similar scope. Our mission is to [mission statement].`,
      };
    case "scope":
      return {
        guidance: "Restate the scope in your own structure, then map each requirement to your approach. Use diagrams or numbered phases where helpful.",
        placeholder: `Our technical approach is organized in [N] phases: (1) Discovery & requirements validation, (2) Design & architecture, (3) Implementation, (4) Testing & acceptance, (5) Transition & support. For each requirement in Section [X], we describe the activity, deliverable, owner, and acceptance criteria below.`,
      };
    case "timeline":
      return {
        guidance: "Show a milestone-level schedule. Tie every major deliverable to a date or week-from-award offset.",
        placeholder: `Award (T0) → Kickoff (T0+5 business days) → Requirements sign-off (T0+3 weeks) → Pilot delivery (T0+8 weeks) → Full deployment (T0+16 weeks) → Operational acceptance (T0+20 weeks). A detailed Gantt is provided in Appendix [X].`,
      };
    case "pricing":
      return {
        guidance: "Present pricing in the exact format requested. Include assumptions, exclusions, and any optional/priced-separately items.",
        placeholder: `Pricing is presented as [fixed-price / T&M / NTE]. Total proposed price: $[amount]. Breakdown by phase, labor category and ODCs is provided in the cost volume. Assumptions: [list]. Exclusions: [list]. Pricing is firm for [N] days from submission.`,
      };
    case "team":
      return {
        guidance: "Lead with the program manager, then key personnel. Include relevant credentials, years of experience, and similar engagements.",
        placeholder: `Program Manager: [Name], [years] years in ${ind}, [credentials]. Technical Lead: [Name], [credentials]. Full résumés for all key personnel are included in Appendix [X]. Our org chart shows reporting lines, percent allocation, and clearance level for every role.`,
      };
    case "past-performance":
      return {
        guidance: "Three to five recent, relevant engagements. For each: client, contract value, period, scope summary, outcomes, and a reference.",
        placeholder: `Project 1: [Client], [contract value], [period]. Scope: [one sentence]. Outcomes: [quantified result]. Reference: [name, title, contact]. Repeat for two to four additional engagements of similar size and ${ind} relevance.`,
      };
    case "risk":
      return {
        guidance: "List top 5–7 risks. For each: probability, impact, owner, and mitigation/contingency.",
        placeholder: `Risk 1: [description] — Probability: [L/M/H], Impact: [L/M/H], Owner: [role], Mitigation: [action], Contingency: [action]. Repeat for each major risk identified during our bid analysis.`,
      };
    case "qa":
      return {
        guidance: "Describe your QA framework, standards followed (ISO, CMMI, etc.), and the specific checkpoints applied to this engagement.",
        placeholder: `Our QA program is [ISO 9001 certified / CMMI Level 3 appraised]. For this engagement we apply [N] checkpoints: [list]. Defect tracking, root-cause analysis and continuous-improvement metrics are reported [cadence] to the customer's COR.`,
      };
    case "compliance":
      return {
        guidance: "Restate that you comply with every shall/must/will requirement, and reference the compliance matrix attached as an appendix.",
        placeholder: `[Your company] complies with all requirements set forth in this RFP. A full compliance matrix mapping each requirement to the relevant section of this proposal is provided as Appendix [X]. Any exceptions or alternatives are explicitly identified and justified there.`,
      };
  }
}

export function buildDocx(companyName: string, industry: IndustryId | null, selected: SectionId[]): Document {
  const indName = industryName(industry);
  const co = companyName || "[Your Company Name]";
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 240 },
      children: [new TextRun({ text: co, bold: true, size: 48 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: "RFP Response", size: 36, color: "1E40AF" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: `Industry: ${indName}`, size: 24, color: "555555" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: "[RFP Title / Solicitation Number]", italics: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
      children: [new TextRun({ text: "Submitted: [Date]", size: 24 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 240 },
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 32 })] }),
  );
  selected.forEach((s, i) => {
    const meta = SECTIONS.find((x) => x.id === s)!;
    children.push(new Paragraph({ spacing: { after: 80 },
      children: [new TextRun({ text: `${i + 1}. ${meta.title}`, size: 24 })] }));
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));

  selected.forEach((s, i) => {
    const meta = SECTIONS.find((x) => x.id === s)!;
    const body = sectionBody(s, industry);
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 },
        children: [new TextRun({ text: `${i + 1}. ${meta.title}`, bold: true, size: 32, color: "1E40AF" })] }),
      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: `Guidance: ${body.guidance}`, italics: true, color: "666666", size: 20 })] }),
      new Paragraph({ spacing: { after: 240 },
        children: [new TextRun({ text: body.placeholder, size: 24 })] }),
    );
    if (i < selected.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  });

  return new Document({
    creator: "OptiRFP.ai",
    title: `${co} — RFP Response`,
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });
}

export function buildPdf(companyName: string, industry: IndustryId | null, selected: SectionId[]): jsPDF {
  const indName = industryName(industry);
  const co = companyName || "[Your Company Name]";
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54;
  const MAX = W - M * 2;

  doc.setFont("helvetica", "bold"); doc.setFontSize(28);
  doc.text(co, W / 2, H / 3, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(20); doc.setTextColor(30, 64, 175);
  doc.text("RFP Response", W / 2, H / 3 + 36, { align: "center" });
  doc.setTextColor(85); doc.setFontSize(13);
  doc.text(`Industry: ${indName}`, W / 2, H / 3 + 64, { align: "center" });
  doc.text("[RFP Title / Solicitation Number]", W / 2, H / 3 + 84, { align: "center" });
  doc.text("Submitted: [Date]", W / 2, H / 3 + 104, { align: "center" });

  doc.addPage();
  doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("Table of Contents", M, M + 10);
  doc.setFont("helvetica", "normal"); doc.setFontSize(12);
  let y = M + 44;
  selected.forEach((s, i) => {
    const meta = SECTIONS.find((x) => x.id === s)!;
    doc.text(`${i + 1}. ${meta.title}`, M, y); y += 20;
  });

  selected.forEach((s, i) => {
    doc.addPage();
    const meta = SECTIONS.find((x) => x.id === s)!;
    const body = sectionBody(s, industry);
    doc.setTextColor(30, 64, 175); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(`${i + 1}. ${meta.title}`, M, M + 10);
    doc.setTextColor(102); doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    const g = doc.splitTextToSize(`Guidance: ${body.guidance}`, MAX);
    doc.text(g, M, M + 36);
    doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    const p = doc.splitTextToSize(body.placeholder, MAX);
    doc.text(p, M, M + 36 + g.length * 12 + 16);
  });

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(140);
    doc.text(`${co}   ·   Page ${p} of ${total}`, W / 2, H - 24, { align: "center" });
  }
  return doc;
}

export async function downloadDocx(companyName: string, industry: IndustryId | null, selected: SectionId[], filename: string): Promise<void> {
  const { saveAs } = await import("file-saver");
  const doc = buildDocx(companyName, industry, selected);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export function downloadPdf(companyName: string, industry: IndustryId | null, selected: SectionId[], filename: string): void {
  const doc = buildPdf(companyName, industry, selected);
  doc.save(filename);
}
