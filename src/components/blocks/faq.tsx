
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    category: "Pricing & Subscription",
    items: [
      {
        question: "What's included in the free trial?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>14-day access to try core features</li>
            <li>Up to 3 projects</li>
            <li>Access to AI RFP Summary, Proposal Outline, and Basic Proposal Draft features</li>
          </ul>
        ),
      },
      {
        question: "What are the differences between Starter and Pro plans?",
        answer: (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Starter ($49/mo or $499/yr):</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Up to 10 projects</li>
                <li>Basic AI features</li>
                <li>24-hour support response time</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Pro ($99/mo or $950/yr):</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Up to 30 projects</li>
                <li>Advanced AI features including Proposal Evaluation</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        question: "Can I cancel my subscription at any time?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Yes, you can cancel your subscription anytime from your account settings</li>
            <li>You'll continue to have access until the end of your billing period</li>
          </ul>
        ),
      },
    ],
  },
  {
    category: "Features & Usage",
    items: [
      {
        question: "How does the OptiRFP analysis work?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Our AI analyzes your RFP documents</li>
            <li>Identifies key requirements, deadlines, and evaluation criteria</li>
            <li>Provides a structured summary for better understanding</li>
          </ul>
        ),
      },
      {
        question: "What file formats do you support for RFP uploads?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Common document formats (PDF, DOC, DOCX)</li>
            <li>Text files (TXT)</li>
          </ul>
        ),
      },
      {
        question: "How accurate is the AI-generated content?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>AI provides high-quality initial drafts</li>
            <li>All content can be reviewed and edited</li>
            <li>Combines industry best practices with your specific requirements</li>
          </ul>
        ),
      },
      {
        question: "Is my data secure?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Enterprise-grade security measures</li>
            <li>Data encryption in transit and at rest</li>
            <li>Secure user authentication</li>
          </ul>
        ),
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        question: "Can I export my proposals?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Yes, proposals can be exported in various formats</li>
            <li>All content remains accessible in your account</li>
          </ul>
        ),
      },
      {
        question: "Do you integrate with other tools?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Currently focused on core RFP and proposal features</li>
            <li>Integration roadmap will be made available soon</li>
          </ul>
        ),
      },
      {
        question: "What browsers are supported?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>All modern browsers (Chrome, Firefox, Safari, Edge)</li>
            <li>Optimized for desktop and tablet use</li>
          </ul>
        ),
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        question: "What kind of support do you offer?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>Email support for all plans</li>
            <li>Priority support for Pro plan users</li>
          </ul>
        ),
      },
      {
        question: "What's your uptime guarantee?",
        answer: (
          <ul className="list-disc pl-6 space-y-1">
            <li>99.9% uptime commitment</li>
            <li>Regular system maintenance and updates</li>
          </ul>
        ),
      },
    ],
  },
];

export function FAQ() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-8">
        {faqData.map((category, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold mb-4">{category.category} FAQs</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
