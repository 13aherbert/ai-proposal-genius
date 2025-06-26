
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'productivity' | 'collaboration' | 'advanced';
  unlockCondition: {
    type: 'projects_created' | 'knowledge_entries' | 'proposals_generated';
    threshold: number;
  };
  ctaText: string;
  ctaAction: string;
}

const features: Feature[] = [
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Store and reuse your best content across multiple proposals',
    icon: Lightbulb,
    category: 'productivity',
    unlockCondition: { type: 'projects_created', threshold: 2 },
    ctaText: 'Explore Knowledge Base',
    ctaAction: '/knowledge-base'
  },
  {
    id: 'proposal-templates',
    title: 'Custom Templates',
    description: 'Create your own reusable proposal templates for faster creation',
    icon: CheckCircle,
    category: 'productivity',
    unlockCondition: { type: 'proposals_generated', threshold: 3 },
    ctaText: 'Create Template',
    ctaAction: '/templates'
  }
];

interface ProgressiveFeatureDiscoveryProps {
  projectCount: number;
  knowledgeCount: number;
  proposalCount?: number;
}

export function ProgressiveFeatureDiscovery({ 
  projectCount, 
  knowledgeCount, 
  proposalCount = 0 
}: ProgressiveFeatureDiscoveryProps) {
  const [dismissedFeatures, setDismissedFeatures] = useState<string[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedFeatures') || '[]');
    setDismissedFeatures(dismissed);

    // Check which features should be shown
    const available = features.filter(feature => {
      if (dismissed.includes(feature.id)) return false;

      switch (feature.unlockCondition.type) {
        case 'projects_created':
          return projectCount >= feature.unlockCondition.threshold;
        case 'knowledge_entries':
          return knowledgeCount >= feature.unlockCondition.threshold;
        case 'proposals_generated':
          return proposalCount >= feature.unlockCondition.threshold;
        default:
          return false;
      }
    });

    setAvailableFeatures(available);
  }, [projectCount, knowledgeCount, proposalCount]);

  const dismissFeature = (featureId: string) => {
    const updated = [...dismissedFeatures, featureId];
    setDismissedFeatures(updated);
    localStorage.setItem('dismissedFeatures', JSON.stringify(updated));
    setAvailableFeatures(prev => prev.filter(f => f.id !== featureId));
  };

  if (availableFeatures.length === 0) return null;

  return (
    <div className="space-y-4">
      {availableFeatures.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.id} className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="secondary">New Feature</Badge>
                    </div>
                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissFeature(feature.id)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button size="sm" className="flex items-center gap-2">
                  {feature.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => dismissFeature(feature.id)}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
