/**
 * Security provider that implements client-side security measures
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../AuthProvider';
import { SessionSecurity, CSRFProtection } from '@/utils/security/auth-security';
import { toast } from 'sonner';

interface SecurityContextType {
  isSecure: boolean;
  getCsrfToken: () => string | null;
  getCsrfHeaders: () => Record<string, string>;
}

const SecurityContext = createContext<SecurityContextType>({
  isSecure: false,
  getCsrfToken: () => null,
  getCsrfHeaders: () => ({}),
});

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const { session, signOut } = useAuth();

  useEffect(() => {
    // Initialize CSRF protection when app starts
    if (!CSRFProtection.getToken()) {
      CSRFProtection.generateToken();
    }

    // Set up security headers
    const addSecurityHeaders = () => {
      // Content Security Policy
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.supabase.io https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: blob: https://*.supabase.co https://*.supabase.io;
        connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co https://api.openai.com https://*.anthropic.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
        object-src 'none';
        media-src 'self' blob:;
        worker-src 'self' blob:;
        manifest-src 'self';
        upgrade-insecure-requests;
      `.replace(/\s+/g, ' ').trim();
      
      // Only add if not already present
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        document.head.appendChild(meta);
      }

      // X-Frame-Options
      const frameOptions = document.createElement('meta');
      frameOptions.httpEquiv = 'X-Frame-Options';
      frameOptions.content = 'DENY';
      if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
        document.head.appendChild(frameOptions);
      }

      // X-Content-Type-Options
      const contentType = document.createElement('meta');
      contentType.httpEquiv = 'X-Content-Type-Options';
      contentType.content = 'nosniff';
      if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
        document.head.appendChild(contentType);
      }

      // Referrer Policy
      const referrer = document.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'strict-origin-when-cross-origin';
      if (!document.querySelector('meta[name="referrer"]')) {
        document.head.appendChild(referrer);
      }
    };

    addSecurityHeaders();
  }, []);

  useEffect(() => {
    if (!session) return;

    // Start enhanced session monitoring with warning support
    const stopMonitoring = SessionSecurity.startActivityMonitoring(
      () => {
        // Session expired callback
        toast.error('Session expired due to inactivity', {
          description: 'Please sign in again to continue',
        });
        SessionSecurity.invalidateSession();
        signOut();
      },
      () => {
        // Session warning callback
        toast.warning('Session will expire soon', {
          description: 'Your session will expire in 10 minutes due to inactivity',
          duration: 10000,
        });
      }
    );

    return stopMonitoring;
  }, [session, signOut]);

  // Add global error handler for security violations
  useEffect(() => {
    const handleSecurityViolation = (event: SecurityPolicyViolationEvent) => {
      console.warn('Security policy violation:', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        originalPolicy: event.originalPolicy,
      });
      
      // Report critical violations
      if (event.violatedDirective.includes('script-src')) {
        toast.error('Security violation detected', {
          description: 'Potentially malicious script blocked',
        });
      }
    };

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleSecurityViolation);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
    };
  }, []);

  const contextValue: SecurityContextType = {
    isSecure: true,
    getCsrfToken: () => CSRFProtection.getToken(),
    getCsrfHeaders: () => CSRFProtection.getHeaders(),
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};