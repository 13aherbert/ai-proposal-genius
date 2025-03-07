
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";
import { emailService } from "@/services/EmailService";
import { toast } from "sonner";

interface AuthFormProps {
  defaultView?: 'sign_in' | 'sign_up';
}

export const AuthForm = ({ defaultView = 'sign_in' }: AuthFormProps) => {
  const [error, setError] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState(defaultView === 'sign_up');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [birthday, setBirthday] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check for invite parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    const inviteParam = searchParams.get('invite');
    
    if (viewParam === 'sign_up') {
      setIsSignUp(true);
    }
    
    // If we have an invite in session storage, get it
    const storedInvite = sessionStorage.getItem('beta_invite_code');
    if (storedInvite || inviteParam) {
      // We're coming from an invite link, ensure we're in signup mode
      setIsSignUp(true);
    }
  }, [location]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If we have an invite code in the URL or session storage, redirect to beta page
        const searchParams = new URLSearchParams(location.search);
        const inviteParam = searchParams.get('invite');
        const storedInvite = sessionStorage.getItem('beta_invite_code');
        
        if (inviteParam || storedInvite) {
          const inviteCode = inviteParam || storedInvite;
          // Clear the stored invite code
          sessionStorage.removeItem('beta_invite_code');
          // Redirect to beta page with invite code
          navigate(`/beta?invite=${inviteCode}`);
        } else {
          navigate("/dashboard");
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Check for invite code
        const searchParams = new URLSearchParams(location.search);
        const inviteParam = searchParams.get('invite');
        const storedInvite = sessionStorage.getItem('beta_invite_code');
        
        if (inviteParam || storedInvite) {
          const inviteCode = inviteParam || storedInvite;
          // Clear the stored invite code
          sessionStorage.removeItem('beta_invite_code');
          // Redirect to beta page with invite code
          navigate(`/beta?invite=${inviteCode}`);
        } else {
          navigate("/dashboard");
        }
        
        setError("");
      }
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
      if (event === "PASSWORD_RECOVERY") {
        setError("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.search]);

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(getErrorMessage(error as AuthError));
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {isSignUp && (
          <>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday (Optional)</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </Button>
      </form>
    </div>
  );
};
