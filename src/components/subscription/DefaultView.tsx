
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { FeatureComparisonTable } from "@/components/subscription/FeatureComparisonTable";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { TierBadge } from "@/components/subscription/TierBadge";

interface DefaultViewProps {
  handleUpdatePayment: () => Promise<void>;
  isUpdatingPayment: boolean;
  hasStripeCustomer?: boolean;
}

export function DefaultView({
  handleUpdatePayment,
  isUpdatingPayment,
  hasStripeCustomer = false,
}: DefaultViewProps) {
  const { plan } = useSubscriptionFeatures();
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto pt-8 px-4 pb-16">
        {/* Current plan indicator */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            You're currently on <TierBadge tier={plan as any || 'starter'} /> 
          </div>
        </div>

        {hasStripeCustomer && (
          <div className="mb-6 flex justify-center">
            <Button 
              onClick={handleUpdatePayment}
              variant="outline"
              size="sm"
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
        )}

        <SubscriptionPlans />

        {/* Feature comparison table */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-2">Compare All Features</h3>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            See exactly what's included in each plan
          </p>
          <FeatureComparisonTable currentPlan={plan || 'starter'} />
        </div>

        {/* Contact support */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Need help choosing? <a href="mailto:sales@optirfp.ai" className="text-primary underline hover:no-underline">Contact our sales team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
