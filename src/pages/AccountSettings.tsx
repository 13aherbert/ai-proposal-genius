
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Lock, LogOut, Save, CreditCard, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";
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

export default function AccountSettings() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { data: subscription } = useSubscription();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      // Update profile (username)
      if (username) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('profile_id', session.user.id);

        if (profileError) throw profileError;
      }

      // Update email if changed
      if (email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (password && password === confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
        });
        if (passwordError) throw passwordError;
      } else if (password && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      toast.success("Profile updated successfully");

      // Clear password fields after successful update
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

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

  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan_type !== 'trial';
  const currentPlanType = subscription?.plan_type || 'trial';
  
  const getPlanDisplayName = (planType: string) => {
    switch(planType) {
      case 'pro': return 'Pro Plan';
      case 'starter': return 'Starter Plan';
      case 'trial': return 'Trial Plan';
      default: return 'Free Plan';
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <header className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Account Settings</h1>
          </header>

          <div className="grid gap-6 max-w-2xl mx-auto w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </CardContent>
            </Card>

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

            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
