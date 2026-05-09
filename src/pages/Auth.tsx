import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/AuthProvider";

/**
 * Standalone /auth page. Honors ?mode=signup to default to the sign-up tab.
 * Authenticated users are redirected to /dashboard immediately.
 */
export default function Auth() {
  const { session, loading } = useAuth();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "sign_up" : "sign_in";

  useEffect(() => {
    document.title = mode === "sign_up" ? "Sign Up — OptiRFP" : "Sign In — OptiRFP";
  }, [mode]);

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthForm defaultView={mode} variant="page" />;
}
