
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Save, CheckCircle, AlertTriangle } from "lucide-react";
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

// Import our components
import { ProfileCard } from "@/components/account/ProfileCard";
import { EmailCard } from "@/components/account/EmailCard";
import { PasswordCard } from "@/components/account/PasswordCard";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";

/**
 * AccountSettings component - Allows users to manage their account settings including:
 * - Profile information (username, first name, last name, business name, birthday)
 * - Email settings
 * - Password management
 * - Subscription management (view, upgrade, cancel)
 */
export default function AccountSettings() {
  const navigate = useNavigate();
  const { session, deleteAccount } = useAuth();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { data: subscription } = useSubscription();
  
  // Fetch user profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, [session]);

  // Function to fetch profile data - allows reuse after saving
  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoadingProfile(true);
      
      // Use maybeSingle instead of single to handle case where profile doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .select('username, first_name, last_name, business_name, birthday')
        .eq('profile_id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (data) {
        // Set state with the values, using empty string as fallback
        setUsername(data.username || "");
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setBusinessName(data.business_name || "");
        setBirthday(data.birthday || "");
      } else {
        // If no profile exists, create one
        console.log("No profile found, creating one...");
        await createProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Function to create a profile if one doesn't exist
  const createProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          profile_id: session.user.id,
          username: session.user.email,
          first_name: '',
          last_name: '',
          business_name: '',
          birthday: null
        });
      
      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      console.log("Profile created successfully");
      setUsername(session.user.email || "");
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error("Failed to create profile", {
        description: "Please try refreshing the page.",
      });
    }
  };
  
  // Track initial form values to detect changes
  const [initialValues, setInitialValues] = useState({
    username: "",
    firstName: "",
    lastName: "",
    businessName: "",
    birthday: "",
    email: ""
  });
  
  // Set initial values after profile loads
  useEffect(() => {
    if (!isLoadingProfile) {
      setInitialValues({
        username,
        firstName,
        lastName,
        businessName,
        birthday,
        email
      });
      setHasChanges(false);
    }
  }, [isLoadingProfile]);
  
  // Check for unsaved changes by comparing current values with initial values
  useEffect(() => {
    if (!isLoadingProfile) {
      const hasChanges = 
        username !== initialValues.username ||
        firstName !== initialValues.firstName ||
        lastName !== initialValues.lastName ||
        businessName !== initialValues.businessName ||
        birthday !== initialValues.birthday ||
        email !== initialValues.email ||
        password.length > 0;
      
      setHasChanges(hasChanges);
      
      // Reset the success state if any changes are made
      if (hasChanges) {
        setSaveSuccess(false);
      }
    }
  }, [username, firstName, lastName, businessName, birthday, email, password, confirmPassword, isLoadingProfile, initialValues]);

  /**
   * Handles saving user profile changes (username, email, password)
   */
  const handleSave = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      console.log("Updating profile with:", {
        username,
        first_name: firstName,
        last_name: lastName,
        business_name: businessName,
        birthday
      });
      
      // Update profile (username, first name, last name, business name, birthday)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username: username || null,
          first_name: firstName || null,
          last_name: lastName || null,
          business_name: businessName || null,
          birthday: birthday || null
        })
        .eq('profile_id', session.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
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

      // After successful save, update the initial values to match current values
      setInitialValues({
        username,
        firstName,
        lastName,
        businessName,
        birthday,
        email
      });
      
      // Show success state
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Show toast notification
      toast.success("Profile updated successfully", {
        description: "Your account information has been saved.",
        duration: 3000,
      });

      // Clear password fields after successful update
      setPassword("");
      setConfirmPassword("");
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile", {
        description: error.message || "Please try again later.",
      });
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
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              businessName={businessName}
              setBusinessName={setBusinessName}
              birthday={birthday}
              setBirthday={setBirthday}
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
                disabled={isLoading || isLoadingProfile || (!hasChanges && !saveSuccess)}
                className={`w-full sm:w-auto transition-all ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </>
                )}
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
            
            {/* Delete Account Section */}
            <div className="mt-8 border border-destructive/20 rounded-lg p-6 bg-destructive/5">
              <h2 className="text-xl font-semibold text-destructive mb-2">Delete Account</h2>
              <p className="text-muted-foreground mb-4">
                Permanently delete your account and all of your data. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers. All your projects, documents, and
                      subscription information will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={deleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
