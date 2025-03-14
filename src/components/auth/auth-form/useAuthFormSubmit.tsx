
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/EmailService";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthForm } from "./AuthFormContext";
import { withRetry } from "@/utils/network/retry";

export const useAuthFormSubmit = () => {
  const { isSignUp, email, password, firstName, lastName, companyName, birthday, setError } = useAuthForm();
  const navigate = useNavigate();
  const location = useLocation();

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case "Invalid login credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please verify your email address before signing in.";
      case "User not found":
        return "No user found with these credentials.";
      default:
        return error.message;
    }
  };

  const storeUserSession = async (token: string) => {
    localStorage.setItem('userToken', token);
    console.log("Auth token stored in localStorage");
    
    // Prefetch and store user roles for offline access
    try {
      await withRetry(async () => {
        const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles');
        if (!roleError && roleData?.roles) {
          localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
          console.log("User roles stored in localStorage");
        }
      }, 3, 1000); // Try up to 3 times with 1 second delay between attempts
    } catch (roleErr) {
      console.error("Failed to fetch user roles after auth:", roleErr);
    }
    
    // Prefetch subscription data for offline access
    try {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .single();
        
      if (!subError && subData) {
        localStorage.setItem('subscriptionData', JSON.stringify({
          ...subData,
          updated_at: new Date().toISOString()
        }));
        console.log("Subscription data stored in localStorage");
      }
    } catch (subErr) {
      console.error("Failed to fetch subscription data after auth:", subErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Show loading toast for better UX
    const loadingToastId = toast.loading(
      isSignUp ? "Creating your account..." : "Signing you in..."
    );

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              company_name: companyName || null,
              birthday: birthday || null,
            }
          }
        });
        
        toast.dismiss(loadingToastId);
        
        if (error) throw error;
        
        // Store token immediately if available
        if (data?.session?.access_token) {
          await storeUserSession(data.session.access_token);
        }
        
        // Send welcome email after successful signup
        if (data?.user) {
          try {
            await emailService.sendWelcomeEmail(email, firstName);
            toast.success("Welcome email sent to your inbox");
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        toast.dismiss(loadingToastId);
        
        if (error) throw error;
        
        // Store token in localStorage
        if (data?.session?.access_token) {
          await storeUserSession(data.session.access_token);
        }
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      
      if (error instanceof Error) {
        const errorMessage = getErrorMessage(error as AuthError);
        setError(errorMessage);
        toast.error(isSignUp ? "Sign up failed" : "Sign in failed", {
          description: errorMessage
        });
      }
    }
  };

  return { handleSubmit };
};
