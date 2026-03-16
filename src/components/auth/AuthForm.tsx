
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
import { validateEmail, ClientRateLimit } from "@/utils/security/input-sanitizer";
import { CSRFProtection } from "@/utils/security/auth-security";
import { SSOLoginDialog } from "./SSOLoginDialog";
import { Shield } from "lucide-react";

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
  const [showSSODialog, setShowSSODialog] = useState(false);

  // If user just signed up, show onboarding
  if (showOnboarding && session) {
    return <OnboardingRouter />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Rate limiting check
      const rateLimit = ClientRateLimit.getInstance('login');
      if (!rateLimit.checkLimit(email, 5, 300000)) { // 5 attempts per 5 minutes
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors[0]);
      }

      // Basic password validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitized,
        password,
      });

      if (error) throw error;
      
      // Reset rate limit on successful login
      rateLimit.reset(email);
      
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
                data-testid="email-input"
                autoComplete="email"
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
                data-testid="password-input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => setShowSSODialog(true)}
          >
            <Shield className="h-4 w-4" />
            Sign in with SSO
          </Button>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setIsLogin(false)}>
              Don't have an account? Sign up
            </Button>
          </div>
        </CardContent>
      </Card>

      <SSOLoginDialog open={showSSODialog} onOpenChange={setShowSSODialog} />
    </div>
  );
}
