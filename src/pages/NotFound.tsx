import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useSEO } from "@/hooks/use-seo";

export default function NotFound() {
  const navigate = useNavigate();
  const { session } = useAuth();
  useSEO({
    title: "Page Not Found (404) — OptiRFP",
    description: "The page you're looking for doesn't exist. Return to OptiRFP to continue.",
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-brand-green">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate(session ? "/dashboard" : "/")} className="gap-2">
            <Home className="h-4 w-4" />
            {session ? "Return to Dashboard" : "Go to Homepage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
