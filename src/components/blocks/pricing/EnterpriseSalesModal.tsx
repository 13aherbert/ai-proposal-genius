
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Check, ArrowLeft, Mail } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/optirfp/enterprise-demo";

const formSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  teamSize: z.string().min(1, "Please select team size"),
  message: z.string().trim().max(1000).optional(),
});

interface EnterpriseSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: "pricing" | "contact" | "csm" | "white_label" | "other";
  requestedTier?: "enterprise" | "white_label";
}

type ViewState = "calendly" | "form" | "confirmed";

export function EnterpriseSalesModal({ open, onOpenChange, source = "pricing", requestedTier = "enterprise" }: EnterpriseSalesModalProps) {
  const [view, setView] = useState<ViewState>("calendly");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Listen for Calendly booking completion
  useEffect(() => {
    if (!open) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === "calendly.event_scheduled") {
        setView("confirmed");
        toast.success("Demo scheduled successfully!");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setView("calendly");
      setErrors({});
    }
  }, [open]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse({ companyName, email, teamSize, message });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke("submit-enterprise-lead", {
        body: {
          company_name: companyName,
          email,
          team_size: teamSize,
          message: message || null,
          source,
          requested_tier: requestedTier,
        },
      });
      if (error) throw error;
      toast.success("Thanks! Our team will be in touch within 24 hours.");
      setView("confirmed");
      setCompanyName(""); setEmail(""); setTeamSize(""); setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Could not submit your request. Please try again or email sales@optirfp.ai.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {view === "confirmed" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Demo Scheduled!</h2>
            <p className="text-muted-foreground text-center max-w-sm">
              You'll receive a confirmation email shortly. Our enterprise team looks forward to speaking with you.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        ) : view === "calendly" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Schedule Your OptiRFP Demo
              </DialogTitle>
              <DialogDescription>
                30-minute call with our enterprise team. We'll show you how OptiRFP can streamline your RFP process.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <iframe
                src={CALENDLY_URL}
                className="w-full h-[500px] border-0 rounded-md"
                title="Schedule a demo"
              />
              <button
                onClick={() => setView("form")}
                className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                Prefer email? Contact us instead
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Contact Enterprise Sales</DialogTitle>
              <DialogDescription>
                Tell us about your team and we'll tailor a plan for you.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => setView("calendly")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to scheduling
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" />
                {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size *</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger><SelectValue placeholder="Select team size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<5">Less than 5</SelectItem>
                    <SelectItem value="5-20">5–20</SelectItem>
                    <SelectItem value="20-50">20–50</SelectItem>
                    <SelectItem value="50+">50+</SelectItem>
                  </SelectContent>
                </Select>
                {errors.teamSize && <p className="text-xs text-destructive">{errors.teamSize}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your needs..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Sending..." : "Send Inquiry"}</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
