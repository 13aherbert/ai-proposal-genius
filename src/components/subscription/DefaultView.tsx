
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";

interface DefaultViewProps {
  handleUpdatePayment: () => Promise<void>;
  isUpdatingPayment: boolean;
}

export function DefaultView({
  handleUpdatePayment,
  isUpdatingPayment
}: DefaultViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-8 px-4">
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
