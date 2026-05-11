import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, LayoutTemplate } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

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

  const tabs = [
    { id: 'summary', label: 'RFP Summary', icon: ScrollText },
    { id: 'outline', label: 'Proposal Outline', icon: LayoutTemplate },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
              <tab.icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="mt-2 sm:mt-4">
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <RFPAnalysis filePath={filePath} projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="outline" className="mt-2 sm:mt-4">
          <ErrorBoundary>
            <Suspense fallback={<SectionLoading />}>
              <ProposalOutline projectId={projectId} analysis={analysis} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
