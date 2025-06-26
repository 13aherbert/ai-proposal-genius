
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedSignupForm } from "./onboarding/EnhancedSignupForm";
import { OnboardingRouter } from "./onboarding/OnboardingRouter";

interface AuthFormProps {
  defaultView?: 'sign_in' | 'sign_up';
  variant?: 'page' | 'dialog';
}

export function AuthForm({ defaultView = 'sign_in', variant = 'page' }: AuthFormProps) {
  const { session } = useAuth();
  const [isLogin, setIsLogin] = useState(defaultView === 'sign_in');
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If user just signed up, show onboarding
  if (showOnboarding && session) {
    return <OnboardingRouter />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Removed duplicate success toast - AuthProvider handles this
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSuccess = () => {
    setShowOnboarding(true);
  };

  // Determine container classes based on variant
  const containerClasses = variant === 'page' 
    ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
    : "";

  if (!isLogin) {
    return (
      <div className={containerClasses}>
        <EnhancedSignupForm
          onSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setIsLogin(false)}>
              Don't have an account? Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
