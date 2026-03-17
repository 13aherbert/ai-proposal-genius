
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, ArrowRight } from "lucide-react";
import type { OrganizationSize } from "@/components/auth/onboarding/OrganizationSizeSelector";
import type { UseCase } from "@/components/auth/onboarding/UseCaseSelector";

interface FeatureSpotlightProps {
  organizationSize?: OrganizationSize;
  useCase?: UseCase;
  onDismiss?: () => void;
}

const getSpotlightFeatures = (organizationSize?: OrganizationSize, useCase?: UseCase) => {
  // Feature recommendations based on segment
  const features = {
    solo: {
      rfp_response: {
        title: "AI-Powered RFP Analysis",
        description: "Let AI analyze RFP requirements and suggest the best approach for your response.",
        action: "Try AI Analysis",
        path: "/upload-rfp",
        badge: "Time-Saver"
      },
      proposal_management: {
        title: "Smart Templates",
        description: "Build a library of reusable proposal sections that adapt to different clients.",
        action: "Explore Templates",
        path: "/knowledge-base",
        badge: "Efficiency"
      },
      other: {
        title: "Knowledge Base",
        description: "Build your company knowledge base to speed up future proposal creation.",
        action: "Start Building",
        path: "/knowledge-base",
        badge: "Foundation"
      }
    },
    small_team: {
      team_collaboration: {
        title: "Team Workspaces",
        description: "Collaborate in real-time on proposals with version control and team comments.",
        action: "Set Up Team",
        path: "/projects",
        badge: "Collaboration"
      },
      proposal_management: {
        title: "Workflow Automation",
        description: "Set up automated review processes and approval workflows for your team.",
        action: "Configure Workflows",
        path: "/projects",
        badge: "Automation"
      },
      other: {
        title: "Shared Knowledge",
        description: "Create shared knowledge repositories that your entire team can contribute to.",
        action: "Create Repository",
        path: "/knowledge-base",
        badge: "Team Resource"
      }
    },
    medium_business: {
      team_collaboration: {
        title: "Team Workspaces",
        description: "Collaborate in real-time on proposals with version control and team comments.",
        action: "Set Up Team",
        path: "/projects",
        badge: "Collaboration"
      },
      proposal_management: {
        title: "Multi-Team Workflows",
        description: "Configure review processes and approval workflows across departments.",
        action: "Configure Workflows",
        path: "/projects",
        badge: "Scale"
      },
      other: {
        title: "Shared Knowledge",
        description: "Create shared knowledge repositories that your entire organization can contribute to.",
        action: "Create Repository",
        path: "/knowledge-base",
        badge: "Team Resource"
      }
    }
  };

  const sizeFeatures = features[organizationSize || 'solo'];
  return sizeFeatures[useCase || 'other'] || sizeFeatures.other;
};

export function FeatureSpotlight({ organizationSize, useCase, onDismiss }: FeatureSpotlightProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('feature_spotlight_dismissed') === 'true';
  });
  const feature = getSpotlightFeatures(organizationSize, useCase);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('feature_spotlight_dismissed', 'true');
    onDismiss?.();
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Feature Spotlight</CardTitle>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {feature.badge}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold text-amber-900">{feature.title}</h4>
          <CardDescription className="text-amber-700">
            {feature.description}
          </CardDescription>
        </div>
        <Button 
          size="sm" 
          className="bg-amber-600 hover:bg-amber-700"
          onClick={() => window.location.href = feature.path}
        >
          {feature.action}
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
