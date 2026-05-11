import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { usePaymentUpdate } from '@/hooks/subscription/use-payment-update';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  Check,
  X,
  Crown,
  Zap
} from 'lucide-react';

export function SubscriptionManager() {
  const { organization } = useCurrentOrganization();
  const { subscription, loading } = useOrganizationSubscription();
  const { members } = useOrganizationMembers(organization?.id);
  const { handleUpdatePayment, isUpdatingPayment } = usePaymentUpdate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentUsage = {
    seats: members?.length || 0,
    projects: 12, // This would come from actual project count
    storage: 2.4, // GB used
    apiCalls: 15420 // Monthly API calls
  };

  const planLimits = {
    seats: organization?.max_users || 5,
    projects: organization?.max_projects || 10,
    storage: 10, // GB limit
    apiCalls: 50000 // Monthly limit
  };

  const billingHistory = [
    {
      id: '1',
      date: '2024-01-01',
      amount: 99,
      status: 'paid',
      invoice: 'INV-2024-001',
      period: 'Dec 2023 - Jan 2024'
    },
    {
      id: '2', 
      date: '2023-12-01',
      amount: 99,
      status: 'paid',
      invoice: 'INV-2023-012',
      period: 'Nov 2023 - Dec 2023'
    },
    {
      id: '3',
      date: '2023-11-01', 
      amount: 99,
      status: 'paid',
      invoice: 'INV-2023-011',
      period: 'Oct 2023 - Nov 2023'
    }
  ];

  const availablePlans = [
    {
      id: 'growth',
      name: 'Growth',
      price: 199,
      seats: -1,
      projects: 36,
      features: ['Email Support', 'Enhanced AI', 'Unlimited users']
    },
    {
      id: 'business',
      name: 'Business',
      price: 499,
      seats: -1,
      projects: 120,
      features: ['Priority Support', 'Advanced Analytics', 'API Access', 'Custom Branding']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1499,
      seats: -1,
      projects: -1,
      features: ['24/7 Support', 'White Label', 'SSO', 'Advanced Security', 'Custom Integrations']
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const seatUsagePercentage = (currentUsage.seats / planLimits.seats) * 100;
  const projectUsagePercentage = (currentUsage.projects / planLimits.projects) * 100;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Subscription Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Subscription
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {subscription?.plan_type || 'trial'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold">${subscription?.plan_type === 'pro' ? '99' : subscription?.plan_type === 'enterprise' ? '199' : '49'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="text-lg font-medium">Monthly</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Next Billing</p>
                  <p className="text-lg font-medium">Feb 1, 2024</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'}>
                    {subscription?.status || 'trial'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpdatePayment} disabled={isUpdatingPayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isUpdatingPayment ? 'Processing...' : 'Update Payment Method'}
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Change Billing Cycle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Seats Used</span>
                    <span>{currentUsage.seats} / {planLimits.seats}</span>
                  </div>
                  <Progress value={seatUsagePercentage} className="h-2" />
                  {seatUsagePercentage > 80 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You're approaching your seat limit. Consider upgrading your plan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Project Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projects Created</span>
                    <span>{currentUsage.projects} / {planLimits.projects}</span>
                  </div>
                  <Progress value={projectUsagePercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Team Members</span>
                      <span>{currentUsage.seats} / {planLimits.seats}</span>
                    </div>
                    <Progress value={seatUsagePercentage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Projects</span>
                      <span>{currentUsage.projects} / {planLimits.projects}</span>
                    </div>
                    <Progress value={projectUsagePercentage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Storage</span>
                      <span>{currentUsage.storage} GB / {planLimits.storage} GB</span>
                    </div>
                    <Progress value={(currentUsage.storage / planLimits.storage) * 100} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">API Calls (Monthly)</span>
                      <span>{currentUsage.apiCalls.toLocaleString()} / {planLimits.apiCalls.toLocaleString()}</span>
                    </div>
                    <Progress value={(currentUsage.apiCalls / planLimits.apiCalls) * 100} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Usage Tips</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Monitor your seat usage to avoid unexpected charges</p>
                    <p>• Archive completed projects to free up project slots</p>
                    <p>• Use API rate limiting to manage API call usage</p>
                    <p>• Consider upgrading if you frequently hit limits</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                      <TableCell>${bill.amount}</TableCell>
                      <TableCell>
                        <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'}>
                          {bill.status === 'paid' ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{bill.period}</TableCell>
                      <TableCell>{bill.invoice}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {subscription?.plan_type === plan.id && (
                      <Badge>Current</Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold">${plan.price}<span className="text-sm font-normal">/month</span></p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Up to {plan.seats} team members</p>
                    <p className="text-sm text-muted-foreground">Up to {plan.projects} projects</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Features:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full"
                    variant={subscription?.plan_type === plan.id ? 'outline' : 'default'}
                    disabled={subscription?.plan_type === plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {subscription?.plan_type === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}