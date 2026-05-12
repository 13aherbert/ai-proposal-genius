import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowUpCircle, AlertTriangle, Loader2, Tag, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import { toSubscriptionPlan } from "@/types/subscription";
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
import { isNetworkError, getNetworkErrorMessage } from "@/utils/network";
import { DowngradeOption } from "@/components/subscription/DowngradeOption";

interface SubscriptionCardProps {
  subscription?: SubscriptionPlan | null;
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
  const [showDowngradeOption, setShowDowngradeOption] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showCancelReasonInput, setShowCancelReasonInput] = useState(false);
  const { checkSubscription, data: subscriptionFromContext, loading: isContextLoading, error: subscriptionError } = useSubscription();
  const [localSubscription, setLocalSubscription] = useState<SubscriptionPlan | null>(
    initialSubscription ? toSubscriptionPlan(initialSubscription) : null
  );
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasFetchedFromLocal, setHasFetchedFromLocal] = useState(false);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);
  
  // Direct database fetch function with retry mechanism
  const tryDirectFetch = async () => {
    if (directFetchAttempted) return;
    setDirectFetchAttempted(true);
    
    try {
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user?.id) {
        
        return;
      }
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, plan_type, status, project_limit, current_period_end, features, cancel_at_period_end, created_at, updated_at, billing_interval, is_lifetime, lifetime_redemption_id')
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();
        
      if (error) {
        
        // If this is a network error, try to load from localStorage
        if (isNetworkError(error)) {
          loadFromLocalStorage();
        }
      } else if (data) {
        
        // Convert data to SubscriptionPlan type
        const typedData = toSubscriptionPlan(data);
        setLocalSubscription(typedData);
        try {
          localStorage.setItem('subscriptionData', JSON.stringify({
            ...typedData,
            updated_at: new Date().toISOString()
          }));
        } catch (e) {
        }
      } else {
        
        
        // Create a default trial subscription object if nothing was found
        const defaultTrial: SubscriptionPlan = {
          subscription_id: crypto.randomUUID(),
          user_id: sessionData.session.user.id,
          status: 'active',
          plan_type: 'starter',
          project_limit: 3,
          features: {},
          current_period_end: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setLocalSubscription(defaultTrial);
        try {
          localStorage.setItem('subscriptionData', JSON.stringify({
            ...defaultTrial,
            updated_at: new Date().toISOString()
          }));
        } catch (e) {
          
        }
      }
    } catch (err) {
      
      // Try to load from localStorage on any error
      loadFromLocalStorage();
    }
  };
  
  // Load subscription data from localStorage
  const loadFromLocalStorage = () => {
    if (hasFetchedFromLocal) return;
    
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        
        // Convert to SubscriptionPlan type
        const typedData = toSubscriptionPlan(parsedData);
        setLocalSubscription(typedData);
        setHasFetchedFromLocal(true);
      }
    } catch (e) {
      
    }
  };
  
  /**
   * Manually refresh subscription data
   */
  const handleRefreshSubscription = async () => {
    try {
      setIsRefreshing(true);
      
      // Try to refresh through context first
      await checkSubscription();
      
      // If that doesn't work, fall back to direct fetch
      setTimeout(() => {
        if (!subscriptionFromContext) {
          tryDirectFetch();
        }
      }, 1500);
      
      toast.success("Subscription data refreshed");
    } catch (error) {
      
      toast.error("Failed to refresh subscription data");
      
      // Try direct database fetch as fallback
      await tryDirectFetch();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Use subscription from either prop, context, or local state
  const subscription = localSubscription || (subscriptionFromContext ? toSubscriptionPlan(subscriptionFromContext) : null);
  
  // Improved loading state detection
  const isLoading = (isContextLoading && !subscription && !hasFetchedFromLocal && !directFetchAttempted);
  
  // Show loading timeout message after 5 seconds
  useEffect(() => {
    if (isContextLoading && !subscription) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isContextLoading, subscription]);
  
  // Try to load from localStorage early if context is taking too long
  useEffect(() => {
    if (isContextLoading && !subscription && !hasFetchedFromLocal) {
      // Try to load from localStorage after a short delay if context is still loading
      const timer = setTimeout(() => {
        loadFromLocalStorage();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isContextLoading, subscription, hasFetchedFromLocal]);
  
  useEffect(() => {
    // Update local subscription state if context data becomes available
    if (!localSubscription && subscriptionFromContext) {
      setLocalSubscription(toSubscriptionPlan(subscriptionFromContext));
    }
    
    // If there's an error with subscription or loading has taken too long, try direct fetch
    if ((subscriptionError || (loadingTimeout && !subscription)) && !directFetchAttempted) {
      tryDirectFetch();
      
      // If error is network-related, show a toast
      if (isNetworkError(subscriptionError)) {
        toast.error(getNetworkErrorMessage(subscriptionError), {
          description: "Using cached data if available"
        });
      }
    }
  }, [initialSubscription, subscriptionFromContext, localSubscription, 
      isContextLoading, subscriptionError, hasFetchedFromLocal, loadingTimeout, directFetchAttempted]);
  
  // Force subscription check when component mounts
  useEffect(() => {
    const loadSubscriptionData = async () => {
      try {
        
        await checkSubscription();
        
        // If after 2 seconds we still don't have subscription data, try direct fetch
        setTimeout(() => {
          if (!subscriptionFromContext && !localSubscription) {
            
            tryDirectFetch();
          }
        }, 2000);
      } catch (error) {
        
        
        // If this is a network error, try direct fetch
        if (isNetworkError(error)) {
          try {
            await tryDirectFetch();
          } catch (directFetchError) {
            
            loadFromLocalStorage();
          }
        } else {
          // For non-network errors, first try direct fetch then localStorage
          tryDirectFetch();
        }
      }
    };
    
    loadSubscriptionData();
  }, []);

  // Early return for loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading subscription details...</p>
            {loadingTimeout && (
              <div className="mt-4 flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-2">This is taking longer than expected.</p>
                <Button 
                  onClick={handleRefreshSubscription}
                  size="sm"
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show error state if there's a subscription error and no data
  if (subscriptionError && !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-md">
            <h3 className="font-medium text-destructive mb-2">Error Loading Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isNetworkError(subscriptionError) 
                ? getNetworkErrorMessage(subscriptionError)
                : "We couldn't load your subscription information. Please try refreshing the page."}
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button 
                variant="default" 
                onClick={handleRefreshSubscription}
                className="w-full"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Try Again"
                )}
              </Button>
            </div>
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
   * Gets a human-readable plan name based on the plan type
   */
  const getPlanDisplayName = (planType: string) => {
    switch(planType) {
      case 'enterprise': return 'Enterprise Plan';
      case 'business': return 'Business Plan';
      case 'growth': return 'Growth Plan';
      case 'starter': return 'Starter Plan';
      case 'trial': return 'Starter Plan';
      // Legacy slugs
      case 'pro': return 'Business Plan';
      case 'basic': return 'Growth Plan';
      default: return 'Starter Plan';
    }
  };
  
  /**
   * Gets a human-readable status description
   */
  const getStatusDescription = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'trialing': return 'Free Plan';
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
    navigate('/subscription', { state: { fromUpgradeButton: true } });
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
          {(currentPlanType === 'trial' || currentPlanType === 'starter') && !hasActiveSubscription && (
            <p className="mt-2 text-sm text-muted-foreground">
              Projects: 0 of {subscription?.project_limit || 3} used · Upgrade anytime
            </p>
          )}
          {subscription?.current_period_end && currentStatus !== 'trialing' && (
            <p className="text-sm text-muted-foreground">
              Next billing date: {format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}
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
          {currentPlanType !== 'business' && currentPlanType !== 'pro' && currentPlanType !== 'enterprise' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="w-full sm:w-auto">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  {currentPlanType === 'starter' || currentPlanType === 'trial' ? 'Upgrade Plan' : 'Upgrade Plan'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Choose an Option</AlertDialogTitle>
                  <AlertDialogDescription>
                    You can upgrade to unlock more features, or continue with your current plan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  {currentPlanType === 'starter' && (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-medium">Keep Free Plan</h3>
                        <p className="text-sm text-muted-foreground">Continue with 6 projects and basic features - no cost</p>
                        <UpgradeButton 
                          currentPlan={subscription} 
                          targetPlan="starter" 
                          variant="monthly" 
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-medium">Growth Plan</h3>
                    <p className="text-sm text-muted-foreground">Get 36 projects and unlimited users</p>
                    <UpgradeButton 
                      currentPlan={subscription} 
                      targetPlan="growth" 
                      variant="monthly" 
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Business Plan</h3>
                    <p className="text-sm text-muted-foreground">Get 120 projects and all premium features</p>
                    <UpgradeButton 
                      currentPlan={subscription} 
                      targetPlan="business" 
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
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
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
              <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll continue to have access to premium features until the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                {/* Step 1: Initial confirmation with downgrade option */}
                {!showCancelReasonInput && !showDowngradeOption && (
                  <>
                    {/* Show downgrade option for paid users */}
                    {(currentPlanType === 'business' || currentPlanType === 'pro' || currentPlanType === 'growth') && (
                      <DowngradeOption 
                        currentPlan={currentPlanType}
                        onDowngradeSuccess={() => {
                          setCancelDialogOpen(false);
                          checkSubscription();
                        }}
                        onCancel={() => setShowDowngradeOption(false)}
                      />
                    )}
                    
                    <AlertDialogFooter className="mt-4">
                      <AlertDialogCancel onClick={() => {
                        setShowDowngradeOption(false);
                        setShowCancelReasonInput(false);
                      }}>
                        No, keep my subscription
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => setShowCancelReasonInput(true)}>
                        Continue with cancellation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}

                {/* Step 2: Reason collection */}
                {showCancelReasonInput && (
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
