import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";

export const AuthForm = () => {
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes and handle errors
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
        setError(""); // Clear any errors on successful sign in
      }
      if (event === "SIGNED_OUT") {
        navigate("/");
      }
      if (event === "PASSWORD_RECOVERY") {
        setError(""); // Clear errors during password recovery
      }
    });

    // Listen specifically for auth errors
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && !session) {
        const lastError = localStorage.getItem("auth_error");
        if (lastError) {
          setError(lastError);
          localStorage.removeItem("auth_error");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate]);

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

  return (
    <Card className="w-full max-w-md bg-secondary/50 backdrop-blur-sm p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: 'hsl(var(--primary))',
                brandAccent: 'hsl(var(--primary))',
              },
            },
          },
        }}
        providers={[]}
        theme="light"
      />
    </Card>
  );
};