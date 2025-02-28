
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";

// Import our new components
import { ProfileCard } from "@/components/account/ProfileCard";
import { EmailCard } from "@/components/account/EmailCard";
import { PasswordCard } from "@/components/account/PasswordCard";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";

/**
 * AccountSettings component - Allows users to manage their account settings including:
 * - Profile information (username)
 * - Email settings
 * - Password management
 * - Subscription management (view, upgrade, cancel)
 */
export default function AccountSettings() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: subscription } = useSubscription();

  /**
   * Handles saving user profile changes (username, email, password)
   */
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

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out");
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
            {/* Profile Information */}
            <ProfileCard 
              username={username} 
              setUsername={setUsername} 
            />

            {/* Email Settings */}
            <EmailCard 
              email={email} 
              setEmail={setEmail} 
            />

            {/* Password Settings */}
            <PasswordCard 
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
            />

            {/* Subscription Management */}
            <SubscriptionCard subscription={subscription} />

            {/* Action Buttons */}
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
