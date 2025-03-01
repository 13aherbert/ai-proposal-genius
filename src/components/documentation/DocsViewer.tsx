
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, FileText, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

// Import markdown parser
import ReactMarkdown from 'react-markdown';

// Define available documentation types
const docTypes = [{
  id: 'onboarding',
  name: 'User Onboarding',
  icon: <Book className="h-5 w-5" />,
  path: 'UserOnboardingGuide.md'
}, {
  id: 'limitations',
  name: 'Known Limitations',
  icon: <AlertCircle className="h-5 w-5" />,
  path: 'KnownLimitations.md'
}, {
  id: 'troubleshooting',
  name: 'Troubleshooting',
  icon: <FileText className="h-5 w-5" />,
  path: 'TroubleshootingGuide.md'
}, {
  id: 'environment',
  name: 'Environment Variables',
  icon: <Settings className="h-5 w-5" />,
  path: 'EnvironmentVariables.md'
}];

// Pre-import documentation content
import onboardingContent from '@/docs/UserOnboardingGuide.md?raw';
import limitationsContent from '@/docs/KnownLimitations.md?raw';
import troubleshootingContent from '@/docs/TroubleshootingGuide.md?raw';
import environmentContent from '@/docs/EnvironmentVariables.md?raw';

// Map for direct content access
const docContent = {
  onboarding: onboardingContent,
  limitations: limitationsContent,
  troubleshooting: troubleshootingContent,
  environment: environmentContent
};

export function DocsViewer() {
  const {
    docId = 'onboarding'
  } = useParams<{
    docId: string;
  }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('Loading documentation...');
  const [activeTab, setActiveTab] = useState<string>(docId);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    try {
      setError(false);
      const selectedDoc = docTypes.find(doc => doc.id === docId) || docTypes[0];
      
      // Get content directly from imported files
      if (docContent[docId as keyof typeof docContent]) {
        setContent(docContent[docId as keyof typeof docContent]);
        setActiveTab(selectedDoc.id);
      } else {
        throw new Error('Documentation not found');
      }
    } catch (error) {
      console.error('Error loading documentation:', error);
      setError(true);
      setContent('# Error Loading Documentation\n\nSorry, we encountered an error while loading the requested documentation. Please try again later.');
      toast({
        title: "Documentation Error",
        description: "Could not load the requested documentation. Please try another section.",
        variant: "destructive"
      });
    }
  }, [docId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/docs/${value}`);
  };

  return <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Documentation</h1>
      </div>

      {error && <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            There was an error loading the documentation. The content below might be limited or unavailable.
          </AlertDescription>
        </Alert>}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          {docTypes.map(doc => <TabsTrigger key={doc.id} value={doc.id} className="flex items-center">
              <span className="mr-2">{doc.icon}</span>
              <span className="hidden sm:inline">{doc.name}</span>
            </TabsTrigger>)}
        </TabsList>

        {docTypes.map(doc => <TabsContent key={doc.id} value={doc.id} className="mt-0">
            <div className={`bg-muted dark:bg-zinc-800 rounded-lg shadow p-6 border border-muted dark:border-gray-700 ${doc.id === 'environment' ? 'env-vars-content' : ''}`}>
              <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="prose dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-4 prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-medium prose-p:my-4 prose-p:leading-relaxed prose-p:text-brand-green-dark dark:prose-p:text-brand-green prose-li:my-2 prose-li:ml-4 prose-ul:my-4 prose-ol:my-4 prose-a:text-brand-green dark:prose-a:text-brand-green-dark prose-a:font-medium prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-strong:font-semibold prose-strong:text-brand-green-dark dark:prose-strong:text-brand-green text-[16px] leading-relaxed env-vars-custom">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>)}
      </Tabs>

      <style jsx global>{`
        .env-vars-content .prose code {
          background-color: #0EA5E9 !important;
          color: white !important;
          padding: 0.1rem 0.4rem !important;
          border-radius: 0.25rem !important;
          font-weight: 500 !important;
        }
        
        .dark .env-vars-content .prose code {
          background-color: #0EA5E9 !important;
          color: white !important;
        }
      `}</style>
    </div>;
}
