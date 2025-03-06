
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { emailService } from "@/services/EmailService";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHashPresent, setIsHashPresent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a hash parameter in the URL (required for password reset)
    const hash = window.location.hash;
    setIsHashPresent(hash.length > 0);
    
    if (!hash) {
      toast.error("Invalid password reset link", {
        description: "Please request a new password reset link"
      });
    }
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error, data } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast.success("Password updated successfully", {
        description: "You can now log in with your new password"
      });

      // Send password changed confirmation email if we have the user's email
      if (data?.user?.email) {
        await emailService.sendEmail({
          to: [data.user.email],
          subject: "Your OptiRFP password has been changed",
          html: `
            <h2>Password Change Confirmation</h2>
            <p>Your password for OptiRFP has been successfully changed.</p>
            <p>If you did not initiate this change, please contact support immediately.</p>
          `
        });
      }
      
      // Short delay before redirecting
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!isHashPresent || isLoading}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isHashPresent || isLoading}
                  required
                  minLength={8}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!isHashPresent || isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
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
    </div>
  );
}
