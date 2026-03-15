import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DowngradeOptionProps {
  currentPlan: string;
  onDowngradeSuccess?: () => void;
  onCancel?: () => void;
}

const PLAN_FEATURES = {
  enterprise: [
    'Unlimited projects',
    'Unlimited team members',
    'SSO/SAML (Okta, Azure AD, Google)',
    'SOC 2 Type II & FedRAMP',
    'Dedicated Customer Success Manager',
    'Custom SLAs',
    'On-premise deployment option',
  ],
  business: [
    '120 projects per year',
    'Unlimited team members',
    'Advanced AI with compliance checking',
    'Unlimited Opportunity Search',
    'AI Proposal Evaluation',
    'API access (5,000 calls/mo)',
    'Priority support (4hr)',
    'Salesforce, HubSpot, Slack, Teams',
  ],
  growth: [
    '36 projects per year',
    'Unlimited team members',
    'Enhanced AI analysis',
    'Opportunity Search (10/mo)',
    'No watermarks',
    'Email support (24hr)',
    'Google Drive, SharePoint, Dropbox',
  ],
  starter: [
    '6 projects per year',
    'Basic AI RFP Summary',
    'AI Proposal Outline',
    'Standard AI Draft (watermarked)',
    'Community support',
  ]
};

/**
 * DowngradeOption - Offers downgrade as an alternative to cancellation
 * Shows feature comparison and handles the downgrade process
 */
export function DowngradeOption({ currentPlan, onDowngradeSuccess, onCancel }: DowngradeOptionProps) {
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'starter' | null>(null);

  // Determine available downgrade options based on current plan
  const downgradeOptions = currentPlan === 'enterprise'
    ? [{ plan: 'business' as const, name: 'Business', price: '$499/mo' }, { plan: 'growth' as const, name: 'Growth', price: '$199/mo' }]
    : currentPlan === 'business'
    ? [{ plan: 'growth' as const, name: 'Growth', price: '$199/mo' }]
    : [];

  // Features that will be lost when downgrading
  const getLostFeatures = (targetPlan: string): string[] => {
    const currentFeatures = PLAN_FEATURES[currentPlan as keyof typeof PLAN_FEATURES] || [];
    const targetFeatures = PLAN_FEATURES[targetPlan as keyof typeof PLAN_FEATURES] || [];
    
    return currentFeatures.filter(feature => !targetFeatures.includes(feature));
  };

  const handleDowngrade = async (targetPlan: 'basic' | 'starter') => {
    setIsDowngrading(true);
    setSelectedPlan(targetPlan);

    try {
      const { data, error } = await supabase.functions.invoke('downgrade-subscription', {
        body: { 
          targetPlan,
          reason: 'User chose to downgrade instead of cancel'
        }
      });

      if (error) throw error;

      toast.success(data.message || `Successfully downgraded to ${targetPlan}`, {
        description: data.prorationCredit || 'Changes will take effect at your next billing cycle.'
      });

      onDowngradeSuccess?.();
    } catch (error: any) {
      console.error('Downgrade error:', error);
      toast.error("Failed to downgrade subscription", {
        description: error.message || "Please try again or contact support"
      });
    } finally {
      setIsDowngrading(false);
      setSelectedPlan(null);
    }
  };

  if (downgradeOptions.length === 0) {
    return null; // No downgrade options for starter plan
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <ArrowDown className="h-5 w-5 text-primary" />
        <h4 className="font-medium">Consider a downgrade instead?</h4>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Instead of canceling completely, you can downgrade to a lower plan and keep some features.
      </p>

      {downgradeOptions.map((option) => {
        const lostFeatures = getLostFeatures(option.plan);
        const keptFeatures = PLAN_FEATURES[option.plan];

        return (
          <div key={option.plan} className="border rounded-lg p-4 bg-background mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold">{option.name} Plan</span>
                <span className="text-muted-foreground ml-2">{option.price}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDowngrade(option.plan)}
                disabled={isDowngrading}
              >
                {isDowngrading && selectedPlan === option.plan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Downgrade to {option.name}
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {/* Features you'll keep */}
              <div>
                <p className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  You'll keep:
                </p>
                <ul className="space-y-1">
                  {keptFeatures.slice(0, 4).map((feature, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features you'll lose */}
              <div>
                <p className="font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  You'll lose:
                </p>
                <ul className="space-y-1">
                  {lostFeatures.map((feature, i) => (
                    <li key={i} className="text-muted-foreground flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-end mt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          No thanks, continue with cancellation
        </Button>
      </div>
    </div>
  );
}
