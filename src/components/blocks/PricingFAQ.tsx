import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Can I upgrade or downgrade anytime?",
    answer:
      "Yes! You can switch plans at any time. When you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. Downgrades take effect at the end of your current billing period.",
  },
  {
    question: "What happens when I hit my project limit?",
    answer:
      "You'll see a prompt to upgrade to a higher tier. Your existing projects remain accessible — you just won't be able to create new ones until you upgrade or wait for your annual limit to reset.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes — both Growth and Business plans include a 14-day free trial. No credit card required to start. You'll only be charged if you decide to continue after the trial ends.",
  },
  {
    question: "Do you offer annual discounts?",
    answer:
      "Yes! Save 10% when you choose annual billing. Growth drops from $199/mo to $179/mo, and Business drops from $499/mo to $449/mo.",
  },
];

export function PricingFAQ() {
  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
          Pricing FAQ
        </h3>
        <p className="text-muted-foreground text-lg">
          Common questions about plans and billing
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger className="text-left text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
