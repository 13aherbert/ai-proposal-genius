
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RenewalPromptProps {
  isInGracePeriod: () => boolean;
  handleUpdatePayment: () => Promise<void>;
  isUpdatingPayment: boolean;
  setShowRenewalPrompt: (show: boolean) => void;
}

export function RenewalPrompt({
  isInGracePeriod,
  handleUpdatePayment,
  isUpdatingPayment,
  setShowRenewalPrompt
}: RenewalPromptProps) {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg">
        <div className="flex items-center text-amber-600 mb-4">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-bold">Subscription Needs Attention</h2>
        </div>
        
        <p className="mb-4 text-muted-foreground">
          {isInGracePeriod() 
            ? "Your subscription has expired but is in the grace period. Renew now to avoid losing access."
            : "We couldn't process your last payment. Please update your payment method to continue your subscription."}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={handleUpdatePayment} 
            className="w-full flex items-center justify-center gap-2"
            disabled={isUpdatingPayment}
          >
            {isUpdatingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Update Payment Method
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowRenewalPrompt(false)}
            className="w-full"
            disabled={isUpdatingPayment}
          >
            View Subscription Options
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="w-full"
            disabled={isUpdatingPayment}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
