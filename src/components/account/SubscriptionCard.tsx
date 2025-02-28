
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/hooks/use-subscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UpgradeButton } from "@/components/subscription/UpgradeButton";

interface SubscriptionCardProps {
  subscription: SubscriptionPlan | null;
}

/**
 * SubscriptionCard component - Displays subscription information and allows users to
 * upgrade or cancel their subscription
 */
export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  
  const currentPlanType = subscription?.plan_type || 'trial';
  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type !== 'trial';
  
  /**
   * Gets a human-readable plan name based on the plan type
   */
  const getPlanDisplayName = (planType: string) => {
    switch(planType) {
      case 'pro': return 'Pro Plan';
      case 'starter': return 'Starter Plan';
      case 'trial': return 'Trial Plan';
      default: return 'Free Plan';
    }
  };

  /**
   * Handles the cancellation of a subscription
   */
  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const { error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;

      toast.success("Your subscription has been cancelled successfully");
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <p className="mb-2 font-medium">Current Plan: {getPlanDisplayName(currentPlanType)}</p>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {currentPlanType !== 'trial' 
                ? `Next billing date: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : 'Trial plan'}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {currentPlanType !== 'pro' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="w-full sm:w-auto">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  {currentPlanType === 'starter' ? 'Upgrade to Pro' : 'Upgrade Plan'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Choose an Upgrade Option</AlertDialogTitle>
                  <AlertDialogDescription>
                    Select a plan to upgrade your subscription.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  {currentPlanType === 'trial' && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Starter Plan</h3>
                      <p className="text-sm text-muted-foreground">Get access to basic features</p>
                      <UpgradeButton 
                        currentPlan={subscription} 
                        targetPlan="starter" 
                        variant="monthly" 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-medium">Pro Plan</h3>
                    <p className="text-sm text-muted-foreground">Get access to all premium features</p>
                    <UpgradeButton 
                      currentPlan={subscription} 
                      targetPlan="pro" 
                      variant="monthly" 
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {hasActiveSubscription && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={isCancelling}
                  className="w-full sm:w-auto"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll continue to have access to premium features until the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, keep my subscription</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription}>
                    Yes, cancel subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
