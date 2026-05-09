import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

/**
 * Post-signup redirect. The actual onboarding wizard lives on /dashboard
 * (see useOnboardingFlow + OnboardingProgress). This router just bounces
 * authenticated users into the app.
 */
export function OnboardingRouter() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Setting up your experience...</p>
      </div>
    </div>
  );
}
