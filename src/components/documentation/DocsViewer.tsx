
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, FileText, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import markdown parser
import ReactMarkdown from 'react-markdown';

// Define available documentation types
const docTypes = [
  { id: 'onboarding', name: 'User Onboarding', icon: <Book className="h-5 w-5" />, path: 'UserOnboardingGuide.md' },
  { id: 'limitations', name: 'Known Limitations', icon: <AlertCircle className="h-5 w-5" />, path: 'KnownLimitations.md' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: <FileText className="h-5 w-5" />, path: 'TroubleshootingGuide.md' },
  { id: 'environment', name: 'Environment Variables', icon: <Settings className="h-5 w-5" />, path: 'EnvironmentVariables.md' },
];

export function DocsViewer() {
  const { docId = 'onboarding' } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('Loading documentation...');
  const [activeTab, setActiveTab] = useState<string>(docId);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setError(false);
        const selectedDoc = docTypes.find(doc => doc.id === docId) || docTypes[0];
        
        // Use import.meta.env.BASE_URL to ensure correct path resolution
        const response = await fetch(`/src/docs/${selectedDoc.path}`);
        
        if (!response.ok) {
          throw new Error('Failed to load documentation');
        }
        
        const text = await response.text();
        setContent(text);
        setActiveTab(selectedDoc.id);
      } catch (error) {
        console.error('Error loading documentation:', error);
        setError(true);
        
        // If we're on the limitations page, we can directly use the content from the file
        if (docId === 'limitations') {
          // Import the limitations content directly
          import('@/docs/KnownLimitations.md?raw')
            .then(module => {
              setContent(module.default);
              setError(false);
            })
            .catch(err => {
              console.error('Error importing limitations markdown:', err);
              setContent('# Error Loading Documentation\n\nSorry, we encountered an error while loading the requested documentation. Please try again later.');
            });
        } else {
          setContent('# Error Loading Documentation\n\nSorry, we encountered an error while loading the requested documentation. Please try again later.');
        }
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            There was an error loading the documentation. The content below might be limited or unavailable.
          </AlertDescription>
        </Alert>
      )}

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
