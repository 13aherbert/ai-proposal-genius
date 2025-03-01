
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, FileText, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import markdown parser
import ReactMarkdown from 'react-markdown';

// Define available documentation types
const docTypes = [
  { id: 'onboarding', name: 'User Onboarding', icon: <Book className="h-5 w-5" />, path: '/UserOnboardingGuide.md' },
  { id: 'limitations', name: 'Known Limitations', icon: <AlertCircle className="h-5 w-5" />, path: '/KnownLimitations.md' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: <FileText className="h-5 w-5" />, path: '/TroubleshootingGuide.md' },
  { id: 'environment', name: 'Environment Variables', icon: <Settings className="h-5 w-5" />, path: '/EnvironmentVariables.md' },
];

export function DocsViewer() {
  const { docId = 'onboarding' } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('Loading documentation...');
  const [activeTab, setActiveTab] = useState<string>(docId);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const selectedDoc = docTypes.find(doc => doc.id === docId) || docTypes[0];
        const response = await fetch(`/src/docs${selectedDoc.path}`);
        
        if (!response.ok) {
          throw new Error('Failed to load documentation');
        }
        
        const text = await response.text();
        setContent(text);
        setActiveTab(selectedDoc.id);
      } catch (error) {
        console.error('Error loading documentation:', error);
        setContent('# Error Loading Documentation\n\nSorry, we encountered an error while loading the requested documentation. Please try again later.');
      }
    };

    fetchDocumentation();
  }, [docId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/docs/${value}`);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Documentation</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          {docTypes.map((doc) => (
            <TabsTrigger key={doc.id} value={doc.id} className="flex items-center">
              <span className="mr-2">{doc.icon}</span>
              <span className="hidden sm:inline">{doc.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {docTypes.map((doc) => (
          <TabsContent key={doc.id} value={doc.id} className="mt-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
