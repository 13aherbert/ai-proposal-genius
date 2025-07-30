import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useOrganizationSubscription, useSubscriptionPlans } from "@/hooks/useOrganizationSubscription";
import { formatDistanceToNow } from "date-fns";

export function SubscriptionManager() {
  const { subscription, loading, error } = useOrganizationSubscription();
  const { data: plans } = useSubscriptionPlans();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load subscription details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No subscription found</p>
            <Button className="mt-4">Set up Subscription</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'past_due': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'trial': return <Clock className="h-4 w-4" />;
      case 'past_due': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const seatUsagePercentage = subscription.seat_limit ? 
    (subscription.used_seats / subscription.seat_limit) * 100 : 0;

  const currentPlan = plans?.find(plan => plan.name === subscription.plan_type);

  return (
    <div className="space-y-6">
      {/* Current Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your organization's subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {currentPlan?.display_name || subscription.plan_type}
              </h3>
              <p className="text-muted-foreground">
                {currentPlan?.description || `${subscription.billing_model} billing`}
              </p>
            </div>
            <Badge variant={getStatusColor(subscription.status)} className="flex items-center gap-1">
              {getStatusIcon(subscription.status)}
              {subscription.status}
            </Badge>
          </div>

          <Separator />

          {/* Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seat Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </span>
                <span className="text-sm text-muted-foreground">
                  {subscription.used_seats} / {subscription.seat_limit || '∞'}
                </span>
              </div>
              {subscription.seat_limit && (
                <Progress value={seatUsagePercentage} className="h-2" />
              )}
              {seatUsagePercentage > 80 && subscription.seat_limit && (
                <p className="text-xs text-warning">
                  Approaching seat limit. Consider upgrading your plan.
                </p>
              )}
            </div>

            {/* Project Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Project Limit</span>
                <span className="text-sm text-muted-foreground">
                  {subscription.project_limit === -1 ? 'Unlimited' : subscription.project_limit}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Billing Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Billing Information</h4>
            
            {subscription.status === 'trial' && subscription.trial_ends_at && (
              <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  Trial ends {formatDistanceToNow(new Date(subscription.trial_ends_at), { addSuffix: true })}
                </span>
              </div>
            )}

            {subscription.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next billing date</span>
                <span className="text-sm font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}

            {subscription.cancel_at_period_end && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Subscription will be canceled at the end of the current period
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              View Billing History
            </Button>
            
            {subscription.status === 'trial' && (
              <Button>
                Upgrade Plan
              </Button>
            )}
            
            {subscription.status === 'active' && (
              <Button variant="outline">
                Manage Payment Method
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      {plans && plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your organization's needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.name === subscription.plan_type ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                      {plan.name === subscription.plan_type && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <span className="text-2xl font-bold">
                          {plan.base_price === 0 ? 'Free' : `$${plan.base_price / 100}`}
                        </span>
                        {plan.base_price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Seats</span>
                          <span>{plan.seat_limit || 'Unlimited'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Projects</span>
                          <span>{plan.project_limit === -1 ? 'Unlimited' : plan.project_limit}</span>
                        </div>
                      </div>

                      {plan.name !== subscription.plan_type && (
                        <Button className="w-full" variant="outline">
                          {plan.base_price > (currentPlan?.base_price || 0) ? 'Upgrade' : 'Downgrade'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}