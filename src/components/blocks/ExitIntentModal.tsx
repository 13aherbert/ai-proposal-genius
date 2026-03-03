import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Gift, Check, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAnalytics } from "@/hooks/use-analytics";

interface ExitIntentModalProps {
  open: boolean;
  onDismiss: () => void;
  onClose: () => void;
  onSignUp: () => void;
}

function ModalBody({ onDismiss, onSignUp, trackEvent }: {
  onDismiss: () => void;
  onSignUp: () => void;
  trackEvent: (name: string, params?: Record<string, any>) => void;
}) {
  return (
    <div className="p-6">
      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Gift className="w-6 h-6 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
        Wait! Don't miss out on 3 months free
      </h2>

      <p className="text-muted-foreground text-center mb-6">
        Start your OptiRFP trial today and get 90 days free when you upgrade. No credit card required.
      </p>

      <ul className="space-y-2 mb-6 text-sm text-foreground">
        {["AI-powered RFP analysis", "Save 30+ hours per proposal", "Trusted by 500+ teams"].map((text) => (
          <li key={text} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-brand-green shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <Button
          className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
          size="lg"
          onClick={() => {
            trackEvent('exit_intent_signup_clicked');
            onSignUp();
          }}
          data-analytics="exit-intent-signup"
        >
          Start Free Trial
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            trackEvent('exit_intent_dismissed');
            onDismiss();
          }}
        >
          Maybe Later
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        No credit card required. Cancel anytime.
      </p>
    </div>
  );
}

export function ExitIntentModal({ open, onDismiss, onClose, onSignUp }: ExitIntentModalProps) {
  const isMobile = useIsMobile();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (open) trackEvent('exit_intent_shown');
  }, [open, trackEvent]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      trackEvent('exit_intent_closed');
      onClose();
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="p-0 rounded-t-xl">
          <ModalBody onDismiss={onDismiss} onSignUp={onSignUp} trackEvent={trackEvent} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl shadow-2xl">
        <ModalBody onDismiss={onDismiss} onSignUp={onSignUp} trackEvent={trackEvent} />
      </DialogContent>
    </Dialog>
  );
}
