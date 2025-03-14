
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/EmailService";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthForm } from "./AuthFormContext";

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
        
        // Ensure token is stored in localStorage
        if (data?.session?.access_token) {
          localStorage.setItem('userToken', data.session.access_token);
          console.log("Auth token stored in localStorage");
          
          // Prefetch user roles to improve UX
          try {
            const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles');
            if (!roleError && roleData?.roles) {
              localStorage.setItem('userRoles', JSON.stringify(roleData.roles));
              console.log("User roles stored in localStorage");
            }
          } catch (roleErr) {
            console.error("Failed to fetch user roles:", roleErr);
          }
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
