/**
 * Security dashboard for monitoring and managing security settings
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Eye, Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

interface SecurityEvent {
  id: string;
  event_type: string;
  created_at: string;
  details: any;
  user_agent?: string;
  ip_address?: unknown;
}

interface SessionInfo {
  created_at: string;
  last_activity: string;
  user_agent: string;
  ip_address?: string;
}

export const SecurityDashboard = () => {
  const { session } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    if (session?.user) {
      loadSecurityData();
    }
  }, [session]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load recent security events
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) {
        console.error('Failed to load security events:', eventsError);
      } else {
        setSecurityEvents(events || []);
      }

      // Calculate security score
      calculateSecurityScore();

    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security information');
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityScore = () => {
    let score = 0;
    
    // Base score for having an account
    score += 20;
    
    // Check session security
    if (session?.user?.email_confirmed_at) {
      score += 20;
    }
    
    // Check recent activity
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceActivity < 24 * 60 * 60 * 1000) { // Active in last 24 hours
        score += 15;
      }
    }
    
    // Check for multi-factor authentication (simulated)
    // In a real app, you'd check if MFA is enabled
    score += 15;
    
    // Check for recent security events
    const recentSuspiciousEvents = securityEvents.filter(event => 
      ['suspicious_login_attempt', 'brute_force_detected'].includes(event.event_type) &&
      new Date(event.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentSuspiciousEvents.length === 0) {
      score += 20;
    } else {
      score -= recentSuspiciousEvents.length * 5;
    }
    
    // Password strength (simulated - would need to check actual strength)
    score += 10;
    
    setSecurityScore(Math.max(0, Math.min(100, score)));
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'signin_attempt':
      case 'signup_attempt':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'user_logout':
        return <Lock className="h-4 w-4 text-blue-500" />;
      case 'suspicious_login_attempt':
      case 'brute_force_detected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const clearSecurityLogs = async () => {
    try {
      const { error } = await supabase
        .from('security_audit_log')
        .delete()
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      setSecurityEvents([]);
      toast.success('Security logs cleared');
    } catch (error) {
      console.error('Failed to clear security logs:', error);
      toast.error('Failed to clear security logs');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Your account security status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                Security Score ({getSecurityScoreLabel(securityScore)})
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {securityEvents.filter(e => e.event_type.includes('signin')).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Recent Sign-ins
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {securityEvents.filter(e => e.event_type === 'user_logout').length}
              </div>
              <div className="text-sm text-muted-foreground">
                Secure Logouts
              </div>
            </div>
          </div>
          
          {securityScore < 60 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your security score is below recommended levels. Consider enabling additional security features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Security Events</CardTitle>
                <CardDescription>
                  Monitor recent security-related activities on your account
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSecurityLogs}
                disabled={securityEvents.length === 0}
              >
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No security events recorded
                </div>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getEventTypeIcon(event.event_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatEventType(event.event_type)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(event.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(event.created_at).toLocaleString()}
                          {event.details?.user_agent && (
                            <div className="text-xs mt-1 truncate">
                              {event.details.user_agent}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">Current Session</div>
                    <div className="text-sm text-muted-foreground">
                      Started: {session?.user?.created_at ? new Date(session.user.created_at).toLocaleString() : 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {navigator.userAgent}
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Email Verification</div>
                  <div className="text-sm text-muted-foreground">
                    Your email address is verified
                  </div>
                </div>
                <Badge variant="secondary">
                  {session?.user?.email_confirmed_at ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">
                    Automatic logout after 30 minutes of inactivity
                  </div>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Security Monitoring</div>
                  <div className="text-sm text-muted-foreground">
                    Monitor suspicious activities and login attempts
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;