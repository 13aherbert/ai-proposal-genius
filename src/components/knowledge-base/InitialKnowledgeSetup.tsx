
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Sparkles, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { initialKnowledgeEntries } from "@/data/initial-knowledge-base";

interface InitialKnowledgeSetupProps {
  onComplete: () => void;
}

export const InitialKnowledgeSetup = ({ onComplete }: InitialKnowledgeSetupProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedEntries, setCompletedEntries] = useState(0);
  const { session } = useAuth();

  const handleGenerateKnowledge = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to generate knowledge base");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCompletedEntries(0);

    try {
      const total = initialKnowledgeEntries.length;
      
      for (let i = 0; i < total; i++) {
        const entry = initialKnowledgeEntries[i];
        
        // Insert the knowledge entry
        const { error } = await supabase
          .from('knowledge_entries')
          .insert({
            title: entry.title,
            category: entry.category,
            content: entry.content,
            user_id: session.user.id,
          });

        if (error) {
          console.error('Error inserting knowledge entry:', error);
          throw error;
        }

        // Update progress
        const currentProgress = ((i + 1) / total) * 100;
        setProgress(currentProgress);
        setCompletedEntries(i + 1);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success(`Successfully generated ${total} knowledge base entries!`);
      onComplete();
    } catch (error) {
      console.error('Error generating knowledge base:', error);
      toast.error("Failed to generate knowledge base entries");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-brand-green" />
        </div>
        <CardTitle className="text-2xl">Initialize Your Knowledge Base</CardTitle>
        <p className="text-muted-foreground">
          Generate comprehensive documentation covering all OptiRFP features and capabilities
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Documentation Categories:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• RFP Processing & Analysis</li>
              <li>• Proposal Generation</li>
              <li>• Knowledge Management</li>
              <li>• User Authentication</li>
              <li>• Subscription Management</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Content Types:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Procedures & Workflows</li>
              <li>• Best Practices</li>
              <li>• Technical Reference</li>
              <li>• Pricing Guidelines</li>
              <li>• Service Framework</li>
            </ul>
          </div>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Generating knowledge entries...</span>
              <span>{completedEntries} of {initialKnowledgeEntries.length}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {!isGenerating ? (
          <Button 
            onClick={handleGenerateKnowledge}
            className="w-full"
            size="lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Generate Knowledge Base ({initialKnowledgeEntries.length} entries)
          </Button>
        ) : (
          <Button disabled className="w-full" size="lg">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </Button>
        )}

        <div className="text-xs text-muted-foreground text-center">
          This will create {initialKnowledgeEntries.length} comprehensive knowledge base entries 
          covering your OptiRFP platform's capabilities and processes.
        </div>
      </CardContent>
    </Card>
  );
};
