
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;
  path: string;
}

interface OnboardingProgressProps {
  organizationSize?: OrganizationSize;
  useCase?: UseCase;
  hasProjects?: boolean;
  hasKnowledgeEntries?: boolean;
  profileComplete?: boolean;
}

const getOnboardingSteps = (
  organizationSize?: OrganizationSize,
  useCase?: UseCase,
  hasProjects?: boolean,
  hasKnowledgeEntries?: boolean,
  profileComplete?: boolean
): OnboardingStep[] => {
  const baseSteps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Add your business information and preferences',
      completed: profileComplete || false,
      action: 'Complete Profile',
      path: '/account-settings'
    },
    {
      id: 'knowledge',
      title: 'Build Knowledge Base',
      description: 'Add company information and templates',
      completed: hasKnowledgeEntries || false,
      action: 'Add Knowledge',
      path: '/knowledge-base'
    },
    {
      id: 'first_project',
      title: 'Create First Proposal',
      description: 'Upload an RFP and generate your first proposal',
      completed: hasProjects || false,
      action: 'Upload RFP',
      path: '/upload-rfp'
    }
  ];

  // Add segment-specific steps
  if (organizationSize === 'small_team' || organizationSize === 'medium_business') {
    baseSteps.push({
      id: 'team_setup',
      title: 'Set Up Team Access',
      description: 'Invite team members and configure permissions',
      completed: false,
      action: 'Invite Team',
      path: '/account-settings'
    });
  }
        title: 'Review API Documentation',
        description: 'Understand our integration capabilities',
        completed: false,
        action: 'View Docs',
        path: '/docs'
      },
      {
        id: 'integration_plan',
        title: 'Plan Integration',
        description: 'Define your integration requirements',
        completed: false,
        action: 'Contact Sales',
        path: '/beta'
      }
    ];
  }

  return baseSteps;
};

export function OnboardingProgress({ 
  organizationSize, 
  useCase, 
  hasProjects, 
  hasKnowledgeEntries, 
  profileComplete 
}: OnboardingProgressProps) {
  const navigate = useNavigate();
  const steps = getOnboardingSteps(organizationSize, useCase, hasProjects, hasKnowledgeEntries, profileComplete);
  
  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  
  const nextStep = steps.find(step => !step.completed);

  if (completedSteps === steps.length) {
    return null; // Hide when fully onboarded
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>
              {completedSteps} of {steps.length} steps completed
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
        <Progress value={progressPercentage} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
            {step.completed ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${step.completed ? 'text-green-700' : ''}`}>
                {step.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {step.description}
              </div>
            </div>
            {!step.completed && step === nextStep && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(step.path)}
              >
                {step.action}
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
