
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/auth/AuthUserContext';
import { useAuthPersistence } from '@/hooks/auth/useAuthPersistence';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SessionRecoveryProps {
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function SessionRecovery({ onSuccess, onFailure }: SessionRecoveryProps) {
  const { lastError, refreshUserStatus, isOffline, retryAuthentication } = useAuthUser();
  const { restoreSession, recoveryAttempts } = useAuthPersistence();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [autoRecoveryComplete, setAutoRecoveryComplete] = useState(false);

  // Check if there's a stuck loading state
  useEffect(() => {
    // After 8 seconds, show recovery options if we're still seeing errors
    const timeoutId = setTimeout(() => {
      if (lastError || recoveryAttempts > 0) {
        setShowRecoveryOptions(true);
      }
    }, 8000);
    
    return () => clearTimeout(timeoutId);
  }, [lastError, recoveryAttempts]);

  // Auto-attempt recovery once with circuit breaker to prevent loops
  useEffect(() => {
    if ((lastError || showRecoveryOptions) && !isOffline && !isRecovering && 
        recoveryAttempt === 0 && !autoRecoveryComplete) {
      handleRecovery();
      setAutoRecoveryComplete(true);
    }
  }, [lastError, isOffline, isRecovering, recoveryAttempt, showRecoveryOptions, autoRecoveryComplete]);

  const handleRecovery = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setRecoveryAttempt(prev => prev + 1);
    
    try {
      // Circuit breaker - limit max attempts
      if (recoveryAttempt >= 2) {
        console.log("Maximum recovery attempts reached, resetting auth state");
        await supabase.auth.signOut();
        localStorage.clear();
        toast.success("Session reset complete", {
          description: "Redirecting to login page..."
        });
        setTimeout(() => window.location.href = '/login', 1500);
        return;
      }
      
      // Start with standard session restore
      console.log("Attempting session recovery...");
      const session = await restoreSession();
      
      if (session) {
        console.log("Session restored successfully");
        await refreshUserStatus(true);
        setRecoveryFailed(false);
        
        toast.success("Session recovered successfully");
        
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      
      // If session restore fails, try authentication retry mechanism
      console.log("Session restore failed, trying authentication retry...");
      await retryAuthentication();
      setRecoveryFailed(false);
      
      toast.success("Authentication recovered successfully");
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Session recovery failed:", error);
      setRecoveryFailed(true);
      
      if (recoveryAttempt >= 2 || recoveryAttempts >= 2) {
        toast.error("Session recovery failed", {
          description: "Please sign in again"
        });
        
        if (onFailure) {
          onFailure();
        }
      } else {
        toast.error("Failed to recover session", {
          description: "You can try again manually"
        });
      }
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSignOut = () => {
    // Clear local storage and redirect to login
    localStorage.clear();
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!lastError && !showRecoveryOptions) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Session Issue Detected</h2>
          
          <p className="text-muted-foreground mb-4">
            {isOffline 
              ? "You're currently offline. Please check your connection and try again." 
              : "There was a problem with your authentication session. We're trying to recover it automatically."}
          </p>
          
          {lastError && (
            <div className="w-full bg-muted p-3 rounded text-xs font-mono mb-4 text-left overflow-auto max-h-24">
              {lastError.message}
            </div>
          )}
          
          <div className="space-y-3 w-full">
            {isRecovering ? (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recovering session...
              </Button>
            ) : (
              <Button 
                onClick={handleRecovery} 
                className="w-full"
                variant={recoveryFailed ? "default" : "outline"}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {recoveryFailed ? "Try Again" : "Recover Session"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleReload}
            >
              Reload Page
            </Button>
            
            {(recoveryFailed || recoveryAttempt > 1 || recoveryAttempts > 1) && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSignOut}
              >
                Sign Out and Reconnect
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            If problems persist, try clearing your browser cache or using incognito mode.
          </p>
        </div>
      </div>
    </div>
  );
}
