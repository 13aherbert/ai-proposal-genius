
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail } from "@/utils/security/input-sanitizer";
import { ClientRateLimit } from "@/utils/security/input-sanitizer";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email is required");
      return;
    }

    // Enhanced email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.errors[0]);
      return;
    }

    // Client-side rate limiting
    const rateLimiter = ClientRateLimit.getInstance('password-reset');
    if (!rateLimiter.checkLimit(emailValidation.sanitized, 3, 60000)) { // 3 attempts per minute
      toast.error("Too many password reset attempts. Please wait before trying again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check server-side rate limiting first
      const { data: canReset, error: rateLimitError } = await supabase.rpc(
        'check_password_reset_rate_limit', 
        { email_param: emailValidation.sanitized }
      );

      if (rateLimitError || !canReset) {
        throw new Error('Too many password reset attempts. Please try again later.');
      }

      // Log the attempt for security monitoring
      try {
        await supabase.rpc('log_security_event', {
          event_type_param: 'password_reset_attempt',
          details_param: { 
            email: emailValidation.sanitized,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.sanitized, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;

      // Record successful attempt
      try {
        await supabase
          .from('password_reset_attempts')
          .insert({
            email: emailValidation.sanitized,
            success: true
          });
      } catch (recordError) {
        console.warn('Failed to record password reset attempt:', recordError);
      }
      
      toast.success("Password reset email sent", {
        description: "Check your email for the reset link"
      });
      
      // Redirect to a confirmation page or home
      navigate("/");
    } catch (error: any) {
      console.error("Password reset error:", error);

      // Record failed attempt
      try {
        await supabase
          .from('password_reset_attempts')
          .insert({
            email: emailValidation.sanitized,
            success: false
          });
      } catch (recordError) {
        console.warn('Failed to record password reset attempt:', recordError);
      }
      
      toast.error("Failed to send reset email", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a password reset link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handlePasswordReset}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
