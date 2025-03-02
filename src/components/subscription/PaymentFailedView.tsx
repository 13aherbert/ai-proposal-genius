
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CreditCard } from "lucide-react";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";

interface PaymentFailedViewProps {
  handleUpdatePayment: () => Promise<void>;
  isUpdatingPayment: boolean;
}

export function PaymentFailedView({
  handleUpdatePayment,
  isUpdatingPayment
}: PaymentFailedViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="bg-destructive/10 p-4 rounded-lg mb-8 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="font-medium text-destructive">Payment Failed</h3>
            <p className="text-sm">We couldn't process your payment. Please try again with a different payment method.</p>
          </div>
        </div>
        
        <div className="mb-8 flex justify-center">
          <Button 
            onClick={handleUpdatePayment}
            className="flex items-center gap-2"
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
        </div>
        
        <SubscriptionPlans />
      </div>
    </div>
  );
}
