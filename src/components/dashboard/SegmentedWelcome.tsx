
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Users, 
  Building, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";

interface SegmentedWelcomeProps {
  firstName?: string;
  organizationSize?: OrganizationSize;
  useCase?: UseCase;
  industry?: string;
}

const getSegmentIcon = (size?: OrganizationSize) => {
  switch (size) {
    case 'solo': return User;
    case 'small_team': return Users;
    case 'medium_business': return Building;
    default: return User;
  }
};

const getSegmentConfig = (size?: OrganizationSize, useCase?: UseCase) => {
  const baseConfig = {
    solo: {
      title: "Welcome to Your Personal Proposal Hub",
      description: "Streamline your proposal process with AI-powered tools designed for independent professionals.",
      primaryAction: "Create Your First Proposal",
      features: ["AI-powered content generation", "Professional templates", "Quick turnaround tools"],
      quickActions: [
        { label: "Upload RFP", icon: FileText, path: "/upload-rfp" },
        { label: "Browse Templates", icon: Target, path: "/knowledge-base" },
      ]
    },
    small_team: {
      title: "Welcome to Your Team Workspace",
      description: "Collaborate efficiently with your team on proposals and RFP responses.",
      primaryAction: "Start Team Collaboration",
      features: ["Team collaboration", "Shared knowledge base", "Review workflows"],
      quickActions: [
        { label: "Upload RFP", icon: FileText, path: "/upload-rfp" },
        { label: "Team Knowledge", icon: MessageSquare, path: "/knowledge-base" },
      ]
    },
    enterprise: {
      title: "Welcome to Your Enterprise Solution",
      description: "Scale your proposal operations across your organization with enterprise-grade features.",
      primaryAction: "Explore Enterprise Features",
      features: ["Advanced analytics", "Custom workflows", "Enterprise security"],
      quickActions: [
        { label: "Upload RFP", icon: FileText, path: "/upload-rfp" },
        { label: "Analytics Dashboard", icon: Zap, path: "/projects" },
      ]
    },
    white_label: {
      title: "Welcome to Our Partnership Program",
      description: "Let's discuss how to integrate our solution into your platform.",
      primaryAction: "Schedule Integration Call",
      features: ["Custom branding", "API access", "Dedicated support"],
      quickActions: [
        { label: "View Documentation", icon: FileText, path: "/docs" },
        { label: "Contact Support", icon: MessageSquare, path: "/beta" },
      ]
    }
  };

  return baseConfig[size || 'solo'];
};

const getUseCaseRecommendations = (useCase?: UseCase) => {
  const recommendations = {
    rfp_response: [
      "Start by uploading your first RFP document",
      "Build your company knowledge base for faster responses",
      "Use AI-powered analysis to identify key requirements"
    ],
    proposal_management: [
      "Set up your proposal templates and workflows",
      "Organize your team's proposal pipeline",
      "Track proposal success metrics"
    ],
    team_collaboration: [
      "Invite team members to your workspace",
      "Set up shared knowledge repositories",
      "Configure review and approval processes"
    ],
    enterprise_solution: [
      "Configure organization-wide settings",
      "Set up department-specific workflows",
      "Implement compliance and security policies"
    ],
    white_label_integration: [
      "Review API documentation",
      "Plan your integration architecture",
      "Schedule technical consultation"
    ],
    other: [
      "Explore all available features",
      "Start with a simple proposal project",
      "Contact support for personalized guidance"
    ]
  };

  return recommendations[useCase || 'other'];
};

export function SegmentedWelcome({ firstName, organizationSize, useCase, industry }: SegmentedWelcomeProps) {
  const navigate = useNavigate();
  const Icon = getSegmentIcon(organizationSize);
  const config = getSegmentConfig(organizationSize, useCase);
  const recommendations = getUseCaseRecommendations(useCase);

  const handlePrimaryAction = () => {
    if (organizationSize === 'white_label') {
      // For white label, show contact form or redirect to demo
      navigate('/beta');
    } else {
      // For others, go to upload RFP
      navigate('/upload-rfp');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Welcome Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">
                {firstName ? `Hi ${firstName}!` : 'Welcome!'} 
              </CardTitle>
              <CardDescription className="text-base">
                {config.title}
              </CardDescription>
            </div>
            {organizationSize && (
              <Badge variant="secondary" className="capitalize">
                {organizationSize.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{config.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {config.features.map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>

          <Button onClick={handlePrimaryAction} size="lg" className="w-full sm:w-auto">
            {config.primaryAction}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.quickActions.map((action, index) => {
          const ActionIcon = action.icon;
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(action.path)}>
              <CardContent className="flex items-center gap-3 p-4">
                <ActionIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{action.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Personalized Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
          <CardDescription>
            Based on your {useCase?.replace('_', ' ')} use case
            {industry && ` in the ${industry} industry`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
