import { Navigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/AuthProvider";
import { useSEO } from "@/hooks/use-seo";

/**
 * Standalone /auth page. Honors ?mode=signup to default to the sign-up tab.
 * Authenticated users are redirected to /dashboard immediately.
 */
export default function Auth() {
  const { session, loading } = useAuth();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "sign_up" : "sign_in";

  useSEO({
    title: mode === "sign_up" ? "Sign Up — Start Winning RFPs | OptiRFP" : "Sign In — OptiRFP",
    description: mode === "sign_up"
      ? "Create your free OptiRFP account and generate your first AI-powered proposal in minutes."
      : "Sign in to OptiRFP to manage your RFP projects and proposals.",
  });

  if (!loading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthForm defaultView={mode} variant="page" />;
}
