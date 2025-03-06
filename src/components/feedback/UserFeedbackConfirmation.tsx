
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface UserFeedbackConfirmationProps {
  onClose: () => void;
}

export function UserFeedbackConfirmation({ onClose }: UserFeedbackConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="rounded-full bg-green-100 p-3 mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium mb-2">Feedback Submitted</h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        Thank you for your feedback! We've received your message and will review it soon.
        A confirmation has been sent to your email.
      </p>
      
      <Button onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
