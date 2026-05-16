
import { supabase } from "@/integrations/supabase/client";
import { emailService } from "@/services/EmailService";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthForm } from "./AuthFormContext";
import { withRetry } from "@/utils/network/retry";
import { setAuthToken, setUserRoles, setSubscriptionData } from "@/utils/network";
import { PasswordSecurity, SessionSecurity } from "@/utils/security/auth-security";
import { validateEmail } from "@/utils/security/input-sanitizer";
import { lookupSSOForEmail, initiateSSO } from "@/utils/auth/sso";

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
    // Store token using the new TokenManager
    const tokenStored = setAuthToken(token);
    if (tokenStored) {
      console.log("Auth token stored successfully using TokenManager");
    }
    
    // Prefetch and store user roles for offline access
    try {
      await withRetry(async () => {
        const { data: roleData, error: roleError } = await supabase.functions.invoke('get-user-roles');
        if (!roleError && roleData?.roles) {
          setUserRoles(roleData.roles);
          console.log("User roles stored successfully using TokenManager");
        }
      }, 3, 1000); // Try up to 3 times with 1 second delay between attempts
    } catch (roleErr) {
      console.error("Failed to fetch user roles after auth:", roleErr);
    }
    
    // Prefetch subscription data for offline access
    try {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, plan_type, status, project_limit, current_period_end, features, cancel_at_period_end, created_at, updated_at, billing_interval, is_lifetime, lifetime_redemption_id')
        .single();
        
      if (!subError && subData) {
        setSubscriptionData(subData);
        console.log("Subscription data stored successfully using TokenManager");
      }
    } catch (subErr) {
      console.error("Failed to fetch subscription data after auth:", subErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Enhanced client-side validation with server-side backup
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0]);
      return;
    }
    
    // Enhanced password validation for both signup and signin
    if (isSignUp) {
      // Use server-side validation for signup
      try {
        const { data: validationResult, error: validationError } = await supabase
          .rpc('validate_password_policy', { password });
        
        if (validationError) {
          console.error('Password validation error:', validationError);
          setError('Password validation failed. Please try again.');
          return;
        }
        
        if (!validationResult[0]?.is_valid) {
          const errors = validationResult[0]?.errors || ['Password does not meet security requirements'];
          setError(errors.join('. '));
          return;
        }
      } catch (dbError) {
        // Fallback to client-side validation if server validation fails
        console.warn('Server validation failed, using client-side validation:', dbError);
        const passwordValidation = PasswordSecurity.validateStrength(password);
        if (!passwordValidation.isStrong) {
          setError(`Password requirements not met: ${passwordValidation.feedback.join(', ')}`);
          return;
        }
      }
      
      // Business rule validation
      const businessViolations = PasswordSecurity.validateBusinessRules(password, {
        email: emailValidation.sanitized,
        firstName,
        lastName,
        businessName: companyName,
      });
      
      if (businessViolations.length > 0) {
        setError(businessViolations[0]);
        return;
      }
      
      // Check against known breach patterns
      const isSecurePassword = await PasswordSecurity.checkBreachHeuristics(password);
      if (!isSecurePassword) {
        setError('This password appears in data breaches. Please choose a different password.');
        return;
      }
    } else {
      // Basic validation for signin
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      // SSO enforcement: if the email's domain has SSO required, block password sign-in.
      // If sso_auto_redirect is enabled, kick off the IdP flow instead.
      try {
        const ssoInfo = await lookupSSOForEmail(emailValidation.sanitized);
        if (ssoInfo?.ssoEnabled) {
          if (ssoInfo.ssoRequired || ssoInfo.ssoAutoRedirect) {
            const started = await initiateSSO(ssoInfo, emailValidation.sanitized);
            if (started) return;
            if (ssoInfo.ssoRequired) {
              setError(`Your organization (${ssoInfo.organizationName}) requires SSO sign-in. Contact your administrator if you cannot reach the identity provider.`);
              return;
            }
          }
        }
      } catch (ssoErr) {
        console.warn('SSO lookup failed; falling back to password sign-in', ssoErr);
      }
    }
    
    // Show loading toast for better UX
    const loadingToastId = toast.loading(
      isSignUp ? "Creating your account..." : "Signing you in..."
    );

    try {
      // Log security event
      try {
        await supabase.rpc('log_security_event', {
          event_type_param: isSignUp ? 'signup_attempt' : 'signin_attempt',
          details_param: { 
            email: emailValidation.sanitized,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }
      
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
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
        
        // Fire-and-forget admin notification
        if (data?.user) {
          supabase.functions
            .invoke('admin-notify', {
              body: {
                event_type: 'new_user',
                user_id: data.user.id,
                email,
                first_name: firstName,
                last_name: lastName,
                company_name: companyName || null,
              },
            })
            .catch((err) => console.warn('admin-notify failed:', err));
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
