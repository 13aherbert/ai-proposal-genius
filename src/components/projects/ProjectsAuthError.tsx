
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ProjectsAuthError() {
  const navigate = useNavigate();
  
  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-center items-center h-[400px]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-8 border rounded-lg bg-muted/20">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground">You need to be signed in to view your projects.</p>
          <Button onClick={() => navigate("/")} className="mt-2">
            Return to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
