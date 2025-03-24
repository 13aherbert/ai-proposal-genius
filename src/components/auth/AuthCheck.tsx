
import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

interface AuthCheckProps {
  children: ReactNode;
}

export function AuthCheck({ children }: AuthCheckProps) {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
