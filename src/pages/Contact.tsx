
import { Mail, Phone, Clock, Building2, Users, Send, CheckCircle2, ArrowRight, Handshake, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSEO } from "@/hooks/use-seo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

const ease = [0.16, 1, 0.3, 1];

const contactOptions = [
  {
    icon: Building2,
    title: "Sales",
    desc: "Talk to our team about plans, pricing, and how OptiRFP fits your workflow.",
    email: "sales@optirfp.ai",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
  },
  {
    icon: HeadphonesIcon,
    title: "Support",
    desc: "Get help with your account, troubleshoot issues, or ask a product question.",
    email: "support@optirfp.ai",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    desc: "Explore integrations, reseller programs, and strategic partnerships.",
    email: "partners@optirfp.ai",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
];

const tiers = ["Starter", "Growth", "Business", "Enterprise"];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useSEO({
    title: "Contact Us — OptiRFP",
    description: "Get in touch with the OptiRFP team. Reach out for sales inquiries, support, or partnership opportunities.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact OptiRFP",
      description: "Contact the OptiRFP team for sales, support, or partnerships.",
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim();
    const company = (form.elements.namedItem("company") as HTMLInputElement)?.value?.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value?.trim();
    const hp = (form.elements.namedItem("website") as HTMLInputElement)?.value?.trim();

    if (!name || !email || !message || message.length < 10) {
      toast.error("Please fill in name, email, and a message of at least 10 characters.");
      return;
    }

    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("submit-contact-message", {
        body: { name, email, company: company || null, message, hp: hp || null },
      });
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error || error?.message || "Submission failed");
      }
      setSubmitted(true);
      toast.success("Message sent — we'll get back to you within 24 hours.");
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error("Could not send your message. Please email hello@optirfp.ai directly.");
    } finally {
      setSending(false);
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
              <Mail className="mr-1.5 h-3 w-3" /> We'd love to hear from you
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5">
              Get in Touch
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto text-pretty">
              Whether you're exploring OptiRFP for the first time or need help with an existing account — we're here for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-5xl px-6">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16, filter: "blur(4px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">How Can We Help?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Reach the right team directly.</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {contactOptions.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease }}
              >
                <Card className="h-full border-border/60 bg-card hover:shadow-md transition-shadow duration-300 text-center">
                  <CardContent className="p-6 flex flex-col items-center">
                    <div className={`h-12 w-12 rounded-xl ${opt.bg} flex items-center justify-center mb-4`}>
                      <opt.icon className={`h-6 w-6 ${opt.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{opt.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{opt.desc}</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${opt.email}`}>
                        <Mail className="mr-1.5 h-3.5 w-3.5" /> {opt.email}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sales Contact Form */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease }}
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Send Us a Message</h2>
              <p className="text-muted-foreground text-lg mb-8">Fill out the form and our team will respond within 24 hours.</p>

              {submitted ? (
                <Card className="border-brand-green/30 bg-brand-green/5">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-brand-green mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Almost there!</h3>
                    <p className="text-muted-foreground">Thanks for reaching out — we'll respond within 24 hours. You can also email us at <a href="mailto:hello@optirfp.ai" className="text-brand-green hover:underline">hello@optirfp.ai</a>.</p>
                    <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot field, hidden from users */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" required placeholder="John Doe" maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required placeholder="john@company.com" maxLength={255} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Acme Corp" maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" maxLength={20} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="team-size">Team Size</Label>
                      <Select>
                        <SelectTrigger id="team-size">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1–5</SelectItem>
                          <SelectItem value="6-20">6–20</SelectItem>
                          <SelectItem value="21-50">21–50</SelectItem>
                          <SelectItem value="51-200">51–200</SelectItem>
                          <SelectItem value="200+">200+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Interested Tier</Label>
                      <Select>
                        <SelectTrigger id="tier">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiers.map((t) => (
                            <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" required placeholder="Tell us about your needs..." rows={5} maxLength={2000} />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto text-base px-8" disabled={sending}>
                    {sending ? "Sending…" : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info Sidebar */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
            >
              <div className="space-y-6 sticky top-24">
                <Card className="border-border/60 bg-card">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-semibold text-lg">Contact Information</h3>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-brand-green mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">General Inquiries</p>
                        <a href="mailto:hello@optirfp.ai" className="text-sm text-muted-foreground hover:text-brand-green transition-colors">hello@optirfp.ai</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-brand-green mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Enterprise</p>
                        <a href="mailto:enterprise@optirfp.ai" className="text-sm text-muted-foreground hover:text-brand-green transition-colors">enterprise@optirfp.ai</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-brand-green mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Support Hours</p>
                        <p className="text-sm text-muted-foreground">Monday–Friday, 9 AM – 6 PM ET</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-brand-green/20 bg-brand-green/5">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-base mb-2">Prefer a live conversation?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Book a free 30-minute demo with our team.</p>
                    <Button asChild>
                      <Link to="/demo">
                        Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
