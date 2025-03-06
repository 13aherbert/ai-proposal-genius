
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowUpCircle, AlertTriangle, Loader2, Tag, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/types/subscription";
import { useNavigate } from "react-router-dom";
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
import { format, isPast, addDays } from "date-fns";
import { useSubscription } from "@/hooks/use-subscription";

interface SubscriptionCardProps {
  subscription: SubscriptionPlan | null;
}

/**
 * SubscriptionCard component - Displays subscription information and allows users to
 * upgrade or cancel their subscription
 */
export function SubscriptionCard({ subscription: initialSubscription }: SubscriptionCardProps) {
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);
  const { checkSubscription, data: subscriptionFromContext } = useSubscription();
  const [localSubscription, setLocalSubscription] = useState<SubscriptionPlan | null>(initialSubscription);
  
  // Use subscription from either prop or context
  const subscription = localSubscription || subscriptionFromContext;
  
  // Debug logging to help diagnose why subscription data is not displaying correctly
  useEffect(() => {
    console.log("Current subscription data in SubscriptionCard:", { 
      initialSubscription, 
      subscriptionFromContext,
      subscription 
    });
    
    // Update local subscription state if context data becomes available
    if (!localSubscription && subscriptionFromContext) {
      setLocalSubscription(subscriptionFromContext);
    }
  }, [initialSubscription, subscriptionFromContext, localSubscription]);
  
  // Add additional check to directly fetch from API if subscription is null
  useEffect(() => {
    const fetchDirectSubscriptionData = async () => {
      if (!subscription) {
        console.log("No subscription data available in SubscriptionCard, attempting direct fetch");
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.user?.id) {
            console.log("No authenticated user found");
            return;
          }
          
          // Call the edge function directly to get subscription status
          const { data, error } = await supabase.functions.invoke('check-subscription', {
            headers: {
              Authorization: `Bearer ${session.session.access_token}`
            }
          });
          
          if (error) {
            console.error("Error fetching subscription directly:", error);
          } else {
            console.log("Direct subscription fetch result:", data);
            if (data?.subscription) {
              setLocalSubscription(data.subscription);
            }
          }
        } catch (error) {
          console.error("Exception during direct subscription fetch:", error);
        }
      }
    };
    
    fetchDirectSubscriptionData();
  }, [subscription]);
  
  // Early return for loading state
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const currentPlanType = subscription?.plan_type || 'trial';
  const currentStatus = subscription?.status || 'unknown';
  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type !== 'trial';
  
  // Check if subscription is in grace period
  const isInGracePeriod = () => {
    if (!subscription?.current_period_end) return false;
    
    // If subscription is active, it's not in grace period
    if (subscription.status === 'active') return false;
    
    const endDate = new Date(subscription.current_period_end);
    const gracePeriodEnd = addDays(endDate, 3);
    
    return isPast(endDate) && !isPast(gracePeriodEnd);
  };
  
  // Check if subscription has failed payment
  const hasFailedPayment = subscription?.status === 'past_due' || subscription?.status === 'unpaid';

  /**
   * Manually refresh subscription data
   */
  const handleRefreshSubscription = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription();
      toast.success("Subscription data refreshed");
    } catch (error) {
      console.error("Error refreshing subscription:", error);
      toast.error("Failed to refresh subscription data");
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
   * Gets a human-readable status description
   */
  const getStatusDescription = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'trialing': return 'Trial Active';
      case 'past_due': return 'Payment Failed';
      case 'unpaid': return 'Unpaid';
      case 'canceled': return 'Canceled';
      case 'incomplete': return 'Incomplete';
      case 'incomplete_expired': return 'Signup Incomplete';
      default: return 'Unknown';
    }
  };

  /**
   * Handles the cancellation of a subscription
   */
  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      toast.loading("Processing cancellation...");
      
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { 
          reason: cancelReason || 'No reason provided' 
        }
      });
      
      if (error) throw error;

      toast.dismiss();
      toast.success("Your subscription has been cancelled successfully", {
        description: "You'll continue to have access until the end of your current billing period."
      });
      
      // Reset the cancellation dialog state
      setCancelReason("");
      setShowCancelReasonInput(false);
      
      // Refresh subscription data to show updated status
      await checkSubscription();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.dismiss();
      toast.error("Failed to cancel subscription", {
        description: error.message || "Please try again or contact support"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handles renewal of failed payment subscriptions
   */
  const handleRenewSubscription = async () => {
    try {
      setIsRenewing(true);
      toast.loading("Preparing payment update...");
      
      // Call the renew-subscription edge function
      const { error } = await supabase.functions.invoke('renew-subscription', {
        body: { 
          subscriptionId: subscription?.stripe_subscription_id 
        }
      });
      
      if (error) throw error;

      toast.dismiss();
      toast.success("Payment update initiated", {
        description: "You'll be redirected to update your payment method."
      });
      
      // The edge function should return a URL to redirect the user to update payment
      // For now, we'll just redirect to the subscription page
      setTimeout(() => {
        window.location.href = '/subscription';
      }, 1000);
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      toast.dismiss();
      toast.error("Failed to initiate payment update", {
        description: error.message || "Please try again later."
      });
    } finally {
      setIsRenewing(false);
    }
  };

  /**
   * Navigate to subscription page for more plan options
   */
  const handleViewSubscriptionPage = () => {
    navigate('/subscription');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshSubscription}
            disabled={isRefreshing}
            className="px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <p className="mb-2 font-medium">Current Plan: {getPlanDisplayName(currentPlanType)}</p>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{getStatusDescription(currentStatus)}</span>
          </p>
          {subscription?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {currentPlanType !== 'trial' 
                ? `Next billing date: ${format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}`
                : 'Trial plan'}
            </p>
          )}
          
          {subscription?.cancel_at_period_end && (
            <div className="mt-2 flex items-center text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span className="text-sm">
                Your subscription will end on {format(new Date(subscription.current_period_end || ''), 'MMMM dd, yyyy')}
              </span>
            </div>
          )}
          
          {hasFailedPayment && (
            <div className="mt-2 p-2 bg-red-100 rounded-md">
              <p className="text-sm text-red-700 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Payment failed
              </p>
              <p className="text-xs text-red-600 mt-1">
                We couldn't process your payment. Please update your payment method to continue your subscription.
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="mt-2" 
                onClick={handleRenewSubscription}
                disabled={isRenewing}
              >
                {isRenewing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Update payment"
                )}
              </Button>
            </div>
          )}
          
          {isInGracePeriod() && (
            <div className="mt-2 p-2 bg-amber-100 rounded-md">
              <p className="text-sm text-amber-700 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Grace period active
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Your subscription has expired but is in the grace period. Renew now to avoid losing access.
              </p>
              <Button 
                variant="default" 
                size="sm" 
                className="mt-2 bg-amber-600 hover:bg-amber-700" 
                onClick={handleRenewSubscription}
                disabled={isRenewing}
              >
                {isRenewing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Renew now"
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Button to navigate to subscription page */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleViewSubscriptionPage}
        >
          <Tag className="h-4 w-4 mr-2" />
          View Subscription Plans
        </Button>
        
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
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll continue to have access to premium features until the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                {!showCancelReasonInput ? (
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep my subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setShowCancelReasonInput(true)}>
                      Yes, cancel subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                ) : (
                  <>
                    <div className="py-4">
                      <label htmlFor="cancel-reason" className="block text-sm font-medium mb-2">
                        Could you tell us why you're cancelling? (Optional)
                      </label>
                      <select
                        id="cancel-reason"
                        className="w-full border rounded-md p-2"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      >
                        <option value="">Select a reason...</option>
                        <option value="Too expensive">Too expensive</option>
                        <option value="Missing features">Missing features</option>
                        <option value="Not using it enough">Not using it enough</option>
                        <option value="Found an alternative">Found an alternative</option>
                        <option value="Temporary pause">Temporary pause - I'll be back</option>
                        <option value="Other">Other</option>
                      </select>
                      
                      {cancelReason === 'Other' && (
                        <textarea
                          className="w-full border rounded-md p-2 mt-2"
                          placeholder="Please specify..."
                          rows={3}
                          onChange={(e) => setCancelReason(`Other: ${e.target.value}`)}
                        />
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowCancelReasonInput(false)}>
                        Go back
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelSubscription} disabled={isCancelling}>
                        {isCancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Confirm cancellation"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
