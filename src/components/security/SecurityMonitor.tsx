/**
 * Security monitoring component for real-time threat detection
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  details: any;
  created_at: string;
}

interface SecurityMonitorProps {
  onSecurityEvent?: (event: SecurityEvent) => void;
}

export const SecurityMonitor = ({ onSecurityEvent }: SecurityMonitorProps) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startMonitoring = () => {
      setIsMonitoring(true);
      
      // Check for security events every 30 seconds
      intervalId = setInterval(async () => {
        try {
          const { data: securityEvents, error } = await supabase
            .from('security_audit_log')
            .select('*')
            .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Failed to fetch security events:', error);
            return;
          }

          if (securityEvents && securityEvents.length > 0) {
            const newEvents = securityEvents.filter(
              event => !events.some(existingEvent => existingEvent.id === event.id)
            );

            if (newEvents.length > 0) {
              setEvents(prev => [...newEvents, ...prev].slice(0, 100)); // Keep last 100 events
              
              // Handle critical security events
              newEvents.forEach(event => {
                if (event.event_type === 'suspicious_login_attempt' || 
                    event.event_type === 'brute_force_detected') {
                  toast.error('Security Alert', {
                    description: `Suspicious activity detected: ${event.event_type}`,
                    duration: 10000,
                  });
                }
                
                onSecurityEvent?.(event);
              });
            }
          }
        } catch (error) {
          console.error('Security monitoring error:', error);
        }
      }, 30000);
    };

    // Start monitoring immediately and set up cleanup
    startMonitoring();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      setIsMonitoring(false);
    };
  }, [events, onSecurityEvent]);

  // Monitor for session anomalies
  useEffect(() => {
    const detectSessionAnomalies = () => {
      const userAgent = navigator.userAgent;
      const storedUserAgent = localStorage.getItem('expected_user_agent');
      
      if (storedUserAgent && storedUserAgent !== userAgent) {
        // User agent changed - possible session hijacking
        supabase.rpc('log_security_event', {
          event_type_param: 'user_agent_change',
          details_param: {
            old_user_agent: storedUserAgent,
            new_user_agent: userAgent,
            timestamp: new Date().toISOString()
          }
        });
        
        toast.warning('Security Notice', {
          description: 'Your session details have changed. Please verify your identity.',
          duration: 8000,
        });
      } else if (!storedUserAgent) {
        localStorage.setItem('expected_user_agent', userAgent);
      }
    };

    // Check on component mount and when tab becomes visible
    detectSessionAnomalies();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        detectSessionAnomalies();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Don't render anything - this is a monitoring component
  return null;
};

export default SecurityMonitor;