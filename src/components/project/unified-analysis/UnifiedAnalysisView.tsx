import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, LayoutTemplate, Lock } from 'lucide-react';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { GatedFeature } from '@/components/subscription/GatedFeature';

const RFPAnalysis = lazy(() => import('@/components/project/RFPAnalysis').then(mod => ({ default: mod.RFPAnalysis })));
const ProposalOutline = lazy(() => import('@/components/project/proposal-outline/ProposalOutline').then(mod => ({ default: mod.ProposalOutline })));

const SectionLoading = () => (
  <div className="flex justify-center items-center h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface UnifiedAnalysisViewProps {
  projectId: string;
  filePath: string;
  analysis: string | null;
}

export function UnifiedAnalysisView({ projectId, filePath, analysis }: UnifiedAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState('summary');
  const { hasFeature } = useSubscriptionFeatures();

  const tabs = [
    { id: 'summary', label: 'RFP Summary', icon: ScrollText, feature: 'rfp_summary' as const },
    { id: 'outline', label: 'Proposal Outline', icon: LayoutTemplate, feature: 'proposal_outline' as const },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => {
            const locked = !hasFeature(tab.feature);
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
                <tab.icon className="h-4 w-4" />
                <span className={`text-xs sm:text-sm ${locked ? 'opacity-70' : ''}`}>{tab.label}</span>
                {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="summary" className="mt-2 sm:mt-4">
          <GatedFeature
            featureName="RFP Summary"
            requiredTier="growth"
            description="AI-powered analysis of your RFP — requirements, evaluation criteria, key dates, and risks distilled into a clear summary."
            benefits={[
              "Automated requirement extraction",
              "Evaluation criteria & scoring rubric detection",
              "Key dates and submission rules surfaced",
              "Risk and compliance flags",
            ]}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <RFPAnalysis filePath={filePath} projectId={projectId} />
              </Suspense>
            </ErrorBoundary>
          </GatedFeature>
        </TabsContent>

        <TabsContent value="outline" className="mt-2 sm:mt-4">
          <GatedFeature
            featureName="Proposal Outline"
            requiredTier="growth"
            description="Generate a structured outline tailored to the RFP so your draft addresses every required section."
            benefits={[
              "AI-generated section structure",
              "Drag-and-drop reordering",
              "Aligned with RFP scoring criteria",
              "Foundation for content generation",
            ]}
          >
            <ErrorBoundary>
              <Suspense fallback={<SectionLoading />}>
                <ProposalOutline projectId={projectId} analysis={analysis} />
              </Suspense>
            </ErrorBoundary>
          </GatedFeature>
        </TabsContent>
      </Tabs>
    </div>
  );
}
