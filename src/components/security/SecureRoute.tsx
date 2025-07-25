/**
 * Secure route wrapper with additional security checks
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { SessionSecurity } from '@/utils/security/auth-security';
import { toast } from 'sonner';

interface SecureRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireBetaTester?: boolean;
}

export const SecureRoute = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireBetaTester = false 
}: SecureRouteProps) => {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const [isSecurityChecked, setIsSecurityChecked] = useState(false);

  useEffect(() => {
    const performSecurityChecks = async () => {
      try {
        // Check for session hijacking indicators
        const userAgent = navigator.userAgent;
        const storedUserAgent = localStorage.getItem('user_agent');
        
        if (session && storedUserAgent && storedUserAgent !== userAgent) {
          toast.error('Security alert: Session terminated', {
            description: 'Suspicious activity detected',
          });
          await signOut();
          return;
        }
        
        if (session && !storedUserAgent) {
          localStorage.setItem('user_agent', userAgent);
        }

        // Check session validity
        if (session && SessionSecurity.isSessionExpired()) {
          toast.error('Session expired', {
            description: 'Please sign in again to continue',
          });
          await signOut();
          return;
        }

        // Update last activity for valid sessions
        if (session) {
          SessionSecurity.updateLastActivity();
        }

        setIsSecurityChecked(true);
      } catch (error) {
        console.error('Security check failed:', error);
        setIsSecurityChecked(true);
      }
    };

    performSecurityChecks();
  }, [session, signOut]);

  // Show loading while security checks are performed
  if (!isSecurityChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Authentication check
  if (requireAuth && !session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin check (placeholder - would need to implement role checking)
  if (requireAdmin && session) {
    // TODO: Implement actual admin role checking
    // For now, just allow access
  }

  // Beta tester check (placeholder - would need to implement role checking)
  if (requireBetaTester && session) {
    // TODO: Implement actual beta tester role checking
    // For now, just allow access
  }

  return <>{children}</>;
};