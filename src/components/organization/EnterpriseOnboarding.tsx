import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, ArrowRight, Users, Shield, Settings, Palette, Zap } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useOrganizationPermissions } from '@/hooks/useOrganizationPermissions';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action: () => void;
}

export function EnterpriseOnboarding() {
  const { organization } = useCurrentOrganization();
  const { hasPermission } = useOrganizationPermissions(organization?.id);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 'team-setup',
      title: 'Set Up Your Team',
      description: 'Invite team members and configure roles',
      icon: Users,
      completed: completedSteps.includes('team-setup'),
      priority: 'high',
      action: () => {
        // Navigate to team management
        window.location.href = '/organization?tab=team';
      }
    },
    {
      id: 'security-config',
      title: 'Configure Security',
      description: 'Set up SSO and security policies',
      icon: Shield,
      completed: completedSteps.includes('security-config'),
      priority: 'high',
      action: () => {
        // Navigate to security settings
        window.location.href = '/organization?tab=security';
      }
    },
    {
      id: 'organization-settings',
      title: 'Organization Settings',
      description: 'Configure general organization preferences',
      icon: Settings,
      completed: completedSteps.includes('organization-settings'),
      priority: 'medium',
      action: () => {
        // Navigate to organization settings
        window.location.href = '/organization?tab=settings';
      }
    },
    {
      id: 'branding-setup',
      title: 'White Label Branding',
      description: 'Customize your organization\'s appearance',
      icon: Palette,
      completed: completedSteps.includes('branding-setup'),
      priority: 'medium',
      action: () => {
        // Navigate to branding settings
        window.location.href = '/white-label';
      }
    },
    {
      id: 'api-integration',
      title: 'API & Integrations',
      description: 'Set up API keys and external integrations',
      icon: Zap,
      completed: completedSteps.includes('api-integration'),
      priority: 'low',
      action: () => {
        // Navigate to API management
        window.location.href = '/organization?tab=api';
      }
    }
  ];

  useEffect(() => {
    // Check completion status of steps
    checkStepCompletion();
  }, [organization]);

  const checkStepCompletion = async () => {
    const completed: string[] = [];
    
    // Check if team has been set up (more than 1 member)
    // This would typically come from an API call
    
    // Check if security has been configured
    if (organization?.sso_enabled) {
      completed.push('security-config');
    }
    
    // Check if organization settings are complete
    if (organization?.settings && Object.keys(organization.settings).length > 0) {
      completed.push('organization-settings');
    }
    
    // Check if branding is set up
    if (organization?.is_white_label) {
      completed.push('branding-setup');
    }
    
    setCompletedSteps(completed);
  };

  const progress = (completedSteps.length / steps.length) * 100;
  const highPrioritySteps = steps.filter(step => step.priority === 'high' && !step.completed);

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    toast.success('Step completed!');
  };

  const skipOnboarding = () => {
    localStorage.setItem('enterprise-onboarding-skipped', 'true');
    toast.success('Onboarding skipped. You can access these features anytime from your organization dashboard.');
  };

  // Don't show if not enterprise or if already completed/skipped
  if (organization?.subscription_tier !== 'enterprise' || 
      localStorage.getItem('enterprise-onboarding-skipped') === 'true' ||
      completedSteps.length === steps.length) {
    return null;
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Enterprise
              </Badge>
              Enterprise Setup
            </CardTitle>
            <CardDescription>
              Complete these steps to unlock your enterprise capabilities
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={skipOnboarding}>
            Skip Setup
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{completedSteps.length}/{steps.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* High Priority Steps */}
        {highPrioritySteps.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Priority Setup ({highPrioritySteps.length} remaining)
            </h4>
            {highPrioritySteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium">{step.title}</h5>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={step.action}
                  className="flex-shrink-0"
                >
                  Setup <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* All Steps Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">All Setup Steps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {steps.map((step) => (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  step.completed ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`font-medium ${step.completed ? 'text-green-800' : ''}`}>
                    {step.title}
                  </h5>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {!step.completed && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={step.action}
                    className="flex-shrink-0"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Features Preview */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium mb-2">🚀 Your Enterprise Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Unlimited Projects
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Advanced Analytics
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              SSO Integration
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              White Labeling
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              API Access
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Priority Support
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Custom Domains
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Audit Logging
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}