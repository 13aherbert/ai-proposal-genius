
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  teamSize: z.string().min(1, "Please select team size"),
  message: z.string().trim().max(1000).optional(),
});

interface EnterpriseSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnterpriseSalesModal({ open, onOpenChange }: EnterpriseSalesModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
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

    const subject = encodeURIComponent(`Enterprise Inquiry from ${companyName}`);
    const body = encodeURIComponent(
      `Company: ${companyName}\nEmail: ${email}\nTeam Size: ${teamSize}\n\n${message || "No additional message."}`
    );
    window.location.href = `mailto:sales@optirfp.ai?subject=${subject}&body=${body}`;

    toast.success("Opening your email client...", {
      description: "We'll get back to you within 24 hours.",
    });
    onOpenChange(false);
    setCompanyName("");
    setEmail("");
    setTeamSize("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Enterprise Sales</DialogTitle>
          <DialogDescription>
            Tell us about your team and we'll tailor a plan for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
            />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size *</Label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
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
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your needs..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            Send Inquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
