
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/auth/AuthUserContext';
import { useAuthPersistence } from '@/hooks/auth/useAuthPersistence';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (lastError && !isOffline && !isRecovering && recoveryAttempt === 0) {
      // Auto-attempt recovery once
      handleRecovery();
    }
  }, [lastError, isOffline, isRecovering, recoveryAttempt]);

  const handleRecovery = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    setRecoveryAttempt(prev => prev + 1);
    
    try {
      const session = await restoreSession();
      
      if (session) {
        await refreshUserStatus(true);
        setRecoveryFailed(false);
        
        toast.success("Session recovered successfully");
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error("Could not restore session");
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
          description: "Trying alternate method..."
        });
        
        // Try the other recovery mechanism
        try {
          await retryAuthentication();
        } catch (e) {
          console.error("Secondary recovery method failed:", e);
        }
      }
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSignOut = () => {
    // Clear local storage and redirect to login
    localStorage.clear();
    window.location.href = '/login';
  };

  if (!lastError) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Session Error</h2>
          
          <p className="text-muted-foreground mb-4">
            {isOffline 
              ? "You're currently offline. Please check your connection and try again." 
              : "There was a problem with your session. We're trying to recover it automatically."}
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
        </div>
      </div>
    </div>
  );
}
