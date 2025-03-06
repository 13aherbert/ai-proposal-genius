import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Save, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";
import { withRetry, isNetworkError, getNetworkErrorMessage } from "@/utils/network-utils";
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

import { ProfileCard } from "@/components/account/ProfileCard";
import { EmailCard } from "@/components/account/EmailCard";
import { PasswordCard } from "@/components/account/PasswordCard";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";
import { updateRivalProSubscription } from "../scripts/update-specific-user";

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { data: subscription } = useSubscription();
  const isFetchingRef = useRef(false);
  const fetchAttemptsRef = useRef(0);

  useEffect(() => {
    if (session?.user?.id && !isFetchingRef.current) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    if (!session?.user?.id) return;
    if (isFetchingRef.current) return;
    
    if (fetchAttemptsRef.current >= 3) {
      toast.error("Couldn't load profile after multiple attempts", {
        description: "Please check your connection and try again later."
      });
      setFetchError("Maximum retry attempts reached");
      setIsLoadingProfile(false);
      return;
    }
    
    try {
      setIsLoadingProfile(true);
      setFetchError(null);
      isFetchingRef.current = true;
      fetchAttemptsRef.current++;
      
      const result = await withRetry(
        async () => {
          return await supabase
            .from('profiles')
            .select('username, first_name, last_name, business_name, birthday')
            .eq('profile_id', session.user.id)
            .maybeSingle();
        },
        1,
        3000
      );
      
      if (result.error) {
        console.error('Error fetching profile:', result.error);
        const errorMessage = isNetworkError(result.error) ? getNetworkErrorMessage(result.error) : result.error.message;
        setFetchError(errorMessage);
        toast.error("Error loading profile", {
          description: errorMessage
        });
        return;
      }
      
      if (result.data) {
        setUsername(result.data.username || "");
        setFirstName(result.data.first_name || "");
        setLastName(result.data.last_name || "");
        setBusinessName(result.data.business_name || "");
        setBirthday(result.data.birthday || "");
      } else {
        console.log("No profile found, creating one...");
        await createProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = isNetworkError(error) ? getNetworkErrorMessage(error) : "Please try refreshing the page.";
      setFetchError(errorMessage);
      toast.error("Failed to load profile", {
        description: errorMessage
      });
    } finally {
      setIsLoadingProfile(false);
      isFetchingRef.current = false;
      
      if (fetchError && fetchError.includes("Network error") && fetchAttemptsRef.current < 3) {
        setTimeout(() => {
          if (session?.user?.id) fetchProfile();
        }, 10000);
      }
    }
  };

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

  const [initialValues, setInitialValues] = useState({
    username: "",
    firstName: "",
    lastName: "",
    businessName: "",
    birthday: "",
    email: ""
  });

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
      
      if (hasChanges) {
        setSaveSuccess(false);
      }
    }
  }, [username, firstName, lastName, businessName, birthday, email, password, confirmPassword, isLoadingProfile, initialValues]);

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

      if (email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });
        if (emailError) throw emailError;
      }

      if (password && password === confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password,
        });
        if (passwordError) throw passwordError;
      } else if (password && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      setInitialValues({
        username,
        firstName,
        lastName,
        businessName,
        birthday,
        email
      });
      
      setSaveSuccess(true);
      setHasChanges(false);
      
      toast.success("Profile updated successfully", {
        description: "Your account information has been saved.",
        duration: 3000,
      });

      setPassword("");
      setConfirmPassword("");
      
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  const handleRetryFetch = () => {
    if (!isFetchingRef.current) {
      fetchAttemptsRef.current = 0;
      fetchProfile();
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('../scripts/update-specific-user')
        .then(() => console.log("Admin update script loaded"))
        .catch(err => console.error("Failed to load admin update script:", err));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.updateRivalProSubscription = updateRivalProSubscription;
      console.log("✅ updateRivalProSubscription function is now available in the console");
    }
  }, []);

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
            {fetchError && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Failed to load profile data</span>
                </div>
                <p className="text-sm text-muted-foreground">{fetchError}</p>
                <Button 
                  variant="outline" 
                  className="self-start"
                  onClick={handleRetryFetch}
                  disabled={isFetchingRef.current}
                >
                  {isFetchingRef.current ? "Retrying..." : "Retry"}
                </Button>
              </div>
            )}

            {isLoadingProfile && !fetchError ? (
              <div className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ) : (
              <>
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

                <EmailCard 
                  email={email} 
                  setEmail={setEmail} 
                />

                <PasswordCard 
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                />

                <SubscriptionCard subscription={subscription} />

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
              </>
            )}
            
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
