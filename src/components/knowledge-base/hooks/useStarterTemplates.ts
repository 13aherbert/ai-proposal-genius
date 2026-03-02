import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const TEMPLATE_MARKER = "Replace with your content";

function generateCompanyOverview(companyName: string, industry: string) {
  const year = new Date().getFullYear() - 5;
  return `${companyName} is a ${industry} firm specializing in [PRIMARY SERVICES]. Founded in ${year}, we have successfully served [NUMBER] clients across [REGIONS/AREAS].

${TEMPLATE_MARKER}

OUR MISSION
To deliver exceptional [SERVICE TYPE] that helps our clients achieve [KEY OUTCOMES]. We believe in [CORE VALUE 1], [CORE VALUE 2], and [CORE VALUE 3].

CORE CAPABILITIES
• [CAPABILITY 1] - Brief description of what this includes
• [CAPABILITY 2] - Brief description of what this includes
• [CAPABILITY 3] - Brief description of what this includes
• [CAPABILITY 4] - Brief description of what this includes

WHAT SETS US APART
${companyName} differentiates itself through:
1. [DIFFERENTIATOR 1] - Explain what makes this unique
2. [DIFFERENTIATOR 2] - Explain what makes this unique
3. [DIFFERENTIATOR 3] - Explain what makes this unique

COMPANY DETAILS
• Year Established: ${year}
• Headquarters: [CITY, STATE]
• Employees: [NUMBER]
• Certifications: [CERTIFICATION 1], [CERTIFICATION 2]

CONTACT INFORMATION
[PRIMARY CONTACT NAME]
[TITLE]
[EMAIL] | [PHONE]
[COMPANY WEBSITE]`;
}

function generateTeamBios() {
  return `[NAME] - [TITLE/ROLE]

${TEMPLATE_MARKER}

OVERVIEW
[NAME] brings [NUMBER] years of experience in [FIELD/INDUSTRY]. [HE/SHE] has successfully led [NUMBER] projects totaling $[VALUE] in contract value.

KEY QUALIFICATIONS
• [DEGREE], [UNIVERSITY], [YEAR]
• [CERTIFICATION 1] - [ISSUING BODY], [YEAR]
• [CERTIFICATION 2] - [ISSUING BODY], [YEAR]
• [PROFESSIONAL LICENSE] - [STATE/LICENSE NUMBER]

EXPERTISE AREAS
• [EXPERTISE 1] - [Years] years of experience
• [EXPERTISE 2] - [Years] years of experience
• [EXPERTISE 3] - [Years] years of experience

NOTABLE PROJECTS
1. [PROJECT NAME] ([CLIENT NAME])
   • Role: [LEAD/SUPPORT]
   • Duration: [TIMEFRAME]
   • Key Achievement: [SPECIFIC RESULT]

2. [PROJECT NAME] ([CLIENT NAME])
   • Role: [LEAD/SUPPORT]
   • Duration: [TIMEFRAME]
   • Key Achievement: [SPECIFIC RESULT]

CONTACT
[EMAIL] | [PHONE] | [LINKEDIN PROFILE]`;
}

function generatePastPerformance() {
  return `PROJECT: [PROJECT NAME]
CLIENT: [CLIENT NAME/AGENCY]
CONTRACT VALUE: $[AMOUNT]
TIMELINE: [START DATE] - [END DATE]

${TEMPLATE_MARKER}

PROJECT SCOPE
[DETAILED DESCRIPTION OF WORK PERFORMED]

KEY DELIVERABLES
• [DELIVERABLE 1] - [Description and completion date]
• [DELIVERABLE 2] - [Description and completion date]
• [DELIVERABLE 3] - [Description and completion date]

CHALLENGES & SOLUTIONS
Challenge: [SPECIFIC CHALLENGE FACED]
Solution: [HOW IT WAS RESOLVED]

RESULTS & OUTCOMES
• [QUANTIFIABLE RESULT 1]
• [QUANTIFIABLE RESULT 2]
• [QUANTIFIABLE RESULT 3]

CLIENT FEEDBACK
"[TESTIMONIAL QUOTE]" - [CLIENT CONTACT NAME], [TITLE]`;
}

function generateTechnicalCapabilities(companyName: string) {
  return `${companyName} - TECHNICAL EXPERTISE

${TEMPLATE_MARKER}

CORE COMPETENCIES

[PRIMARY CAPABILITY CATEGORY]
• [TECHNOLOGY/SKILL 1] - [Years] years experience
• [TECHNOLOGY/SKILL 2] - [Years] years experience
• [TECHNOLOGY/SKILL 3] - [Years] years experience

[SECONDARY CAPABILITY CATEGORY]
• [METHODOLOGY/TOOL 1] - [Certification/Experience]
• [METHODOLOGY/TOOL 2] - [Certification/Experience]
• [METHODOLOGY/TOOL 3] - [Certification/Experience]

TOOLS & TECHNOLOGY

Software & Platforms:
• [SOFTWARE 1] - [Version/Type]
• [SOFTWARE 2] - [Version/Type]
• [SOFTWARE 3] - [Version/Type]

CERTIFICATIONS & STANDARDS

Industry Certifications:
• [CERTIFICATION 1] - [ISSUING BODY], [DATE]
• [CERTIFICATION 2] - [ISSUING BODY], [DATE]

Quality Management Standards:
• [STANDARD 1] - [CERTIFICATION BODY], [DATE]
• [STANDARD 2] - [CERTIFICATION BODY], [DATE]`;
}

function generatePricingRates(companyName: string) {
  return `${companyName} - PRICING & RATES

${TEMPLATE_MARKER}

STANDARD RATE SCHEDULE

Hourly Rates:
• [ROLE 1 - e.g., Senior Consultant]: $[RATE]/hour
• [ROLE 2 - e.g., Project Manager]: $[RATE]/hour
• [ROLE 3 - e.g., Technical Specialist]: $[RATE]/hour

PROJECT-BASED PRICING

Small Projects ([SCOPE]):
• Typical Range: $[MIN] - $[MAX]
• Typical Duration: [TIMEFRAME]

Medium Projects ([SCOPE]):
• Typical Range: $[MIN] - $[MAX]
• Typical Duration: [TIMEFRAME]

Large Projects ([SCOPE]):
• Typical Range: $[MIN] - $[MAX]
• Typical Duration: [TIMEFRAME]

PAYMENT TERMS

Standard Terms:
• Net [30/45/60] days from invoice date
• [PERCENTAGE]% deposit upon contract signing
• Milestone payments for projects over $[THRESHOLD]

Accepted Payment Methods:
• ACH/Wire Transfer (preferred)
• Check
• Credit Card ([PERCENTAGE]% processing fee)

For custom quotes, contact:
[CONTACT NAME] | [EMAIL] | [PHONE]`;
}

function generateDifferentiators(companyName: string) {
  return `WHY CHOOSE ${companyName}

${TEMPLATE_MARKER}

OUR COMPETITIVE ADVANTAGES

1. [PRIMARY DIFFERENTIATOR - e.g., "Proven Track Record"]
   With [NUMBER] years in business and [NUMBER] successful projects completed,
   we have a demonstrated history of delivering results.
   
   Key Evidence:
   • [METRIC 1 - e.g., "98% on-time delivery rate"]
   • [METRIC 2 - e.g., "$X million in value delivered"]
   • [METRIC 3 - e.g., "X years average client relationship"]

2. [SECONDARY DIFFERENTIATOR - e.g., "Industry Expertise"]
   Our team brings deep expertise in [INDUSTRY/SECTOR].
   
   Key Evidence:
   • [QUALIFICATION 1 - e.g., "Industry-specific certifications"]
   • [QUALIFICATION 2 - e.g., "X years average team experience"]
   • [CLIENT 1], [CLIENT 2] - representative clients

3. [TERTIARY DIFFERENTIATOR - e.g., "Innovative Approach"]
   We leverage cutting-edge [TECHNOLOGY/METHODOLOGY] to deliver superior results.
   
   Key Evidence:
   • [INNOVATION 1 - e.g., "Proprietary platform"]
   • [RESULT - e.g., "X% efficiency improvement"]

VALUE PROPOSITION

For [TARGET CLIENT TYPE], ${companyName} delivers:

✓ [BENEFIT 1 - e.g., "Reduced project timelines by 30%"]
✓ [BENEFIT 2 - e.g., "Cost savings averaging 25%"]
✓ [BENEFIT 3 - e.g., "99% client satisfaction rate"]
✓ [BENEFIT 4 - e.g., "Dedicated support team"]

OUR PROMISE

${companyName} commits to:
• [PROMISE 1 - e.g., "On-time delivery, every time"]
• [PROMISE 2 - e.g., "Transparent communication throughout"]
• [PROMISE 3 - e.g., "Quality that exceeds expectations"]

CLIENT SUCCESS STORIES

[CLIENT 1] - [INDUSTRY]
"[TESTIMONIAL HIGHLIGHTING KEY BENEFIT]"
— [CONTACT NAME], [TITLE]

Ready to experience the difference? Contact us today:
[CONTACT NAME] | [EMAIL] | [PHONE]`;
}

export const TEMPLATE_MARKER_TEXT = TEMPLATE_MARKER;

export function useStarterTemplates() {
  const { session } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasChecked.current) return;
    hasChecked.current = true;

    const checkAndSeed = async () => {
      try {
        // Get user's organization and profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_organization_id, business_name, industry")
          .eq("profile_id", session.user.id)
          .single();

        const orgId = profile?.current_organization_id;
        if (!orgId) return;

        const companyName = profile?.business_name || "[Your Company Name]";
        const industry = profile?.industry || "[Your Industry]";

        // Check if KB already has entries
        const { count } = await supabase
          .from("knowledge_entries")
          .select("entry_id", { count: "exact", head: true })
          .eq("organization_id", orgId);

        if (count && count > 0) return;

        // Build templates with personalized content
        const templates = [
          {
            category: "Company Overview & Mission",
            title: "Company Overview",
            content: generateCompanyOverview(companyName, industry),
          },
          {
            category: "Team & Leadership Bios",
            title: "Key Personnel",
            content: generateTeamBios(),
          },
          {
            category: "Past Performance & Case Studies",
            title: "Past Performance",
            content: generatePastPerformance(),
          },
          {
            category: "Technical Capabilities & Methodologies",
            title: "Technical Capabilities",
            content: generateTechnicalCapabilities(companyName),
          },
          {
            category: "Pricing & Rate Structures",
            title: "Pricing & Rates",
            content: generatePricingRates(companyName),
          },
          {
            category: "Differentiators & Unique Value",
            title: "Why Choose Us",
            content: generateDifferentiators(companyName),
          },
        ];

        // Seed templates
        setIsSeeding(true);
        setSeedingProgress(0);

        for (let i = 0; i < templates.length; i++) {
          const template = templates[i];
          await supabase.from("knowledge_entries").insert({
            organization_id: orgId,
            user_id: session.user.id,
            category: template.category,
            title: template.title,
            content: template.content,
            parsing_status: "completed",
          });
          setSeedingProgress(Math.round(((i + 1) / templates.length) * 100));
        }

        toast.success("Knowledge base populated with starter templates!", {
          description: "Replace the placeholder content with your own.",
        });
      } catch (err) {
        console.error("Error seeding starter templates:", err);
      } finally {
        setIsSeeding(false);
      }
    };

    checkAndSeed();
  }, [session?.user?.id]);

  return { isSeeding, seedingProgress };
}
