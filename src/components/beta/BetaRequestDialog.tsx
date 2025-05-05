
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { emailService } from "@/services/email";

interface BetaRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BetaRequestDialog({ open, onOpenChange }: BetaRequestDialogProps) {
  const { session } = useAuth();
  const [email, setEmail] = useState(session?.user?.email || "");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert the beta request into the database
      const { error } = await supabase
        .from('beta_requests')
        .insert({
          email: email.trim(),
          name: name.trim(),
          reason: reason.trim(),
          status: 'pending'
        });

      if (error) throw error;

      // Send notification email to admins
      try {
        await emailService.beta.sendAdminBetaRequestNotification(
          email.trim(),
          name.trim(),
          reason.trim()
        );
        console.log("Admin notification email sent");
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
        // We don't want to fail the whole request just because email failed
      }

      toast.success("Your beta request has been submitted!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting beta request:", error);
      toast.error("Failed to submit beta request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Request Beta Access</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!session?.user?.email || isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Why are you interested in our beta?</Label>
            <Textarea
              id="reason"
              placeholder="I'm interested because..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!email.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
