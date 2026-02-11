import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, LayoutTemplate } from 'lucide-react';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Lazy load components
const RFPAnalysis = lazy(() => import('@/components/project/RFPAnalysis').then(mod => ({ default: mod.RFPAnalysis })));
const ProposalOutline = lazy(() => import('@/components/project/proposal-outline/ProposalOutline').then(mod => ({ default: mod.ProposalOutline })));

const SectionLoading = () => (
  <div className="flex justify-center items-center h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const FeatureLocked = ({ 
  featureName, 
  planName 
}: { 
  featureName: string;
  planName: string;
}) => {
  const navigate = useNavigate();
  
  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader className="text-center pb-2">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <CardTitle>Feature Not Available</CardTitle>
        <CardDescription>
          {featureName} is available with {planName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <Button 
          onClick={() => navigate('/subscription')}
          className="mt-2"
        >
          Upgrade Subscription
        </Button>
      </CardContent>
    </Card>
  );
};

interface UnifiedAnalysisViewProps {
  projectId: string;
  filePath: string;
  analysis: string | null;
}

export function UnifiedAnalysisView({ projectId, filePath, analysis }: UnifiedAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const { hasFeature, getPlanName } = useSubscriptionFeatures();

  const tabs = [
    {
      id: 'summary',
      label: 'RFP Summary',
      icon: ScrollText,
      feature: 'rfp_summary',
    },
    {
      id: 'outline',
      label: 'Proposal Outline',
      icon: LayoutTemplate,
      feature: 'proposal_outline',
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
              disabled={!hasFeature(tab.feature as any)}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="mt-2 sm:mt-4">
          {hasFeature('rfp_summary') ? (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <RFPAnalysis filePath={filePath} projectId={projectId} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <FeatureLocked 
              featureName="RFP Summary" 
              planName={getPlanName('rfp_summary')} 
            />
          )}
        </TabsContent>

        <TabsContent value="outline" className="mt-2 sm:mt-4">
          {hasFeature('proposal_outline') ? (
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalOutline projectId={projectId} analysis={analysis} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <FeatureLocked 
              featureName="Proposal Outline" 
              planName={getPlanName('proposal_outline')} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
