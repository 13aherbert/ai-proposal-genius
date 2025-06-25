
import { FileText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyKnowledgeStateProps {
  onAddEntry: () => void;
  onGenerateInitial: () => void;
}

export const EmptyKnowledgeState = ({ onAddEntry, onGenerateInitial }: EmptyKnowledgeStateProps) => {
  return (
    <Card className="bg-secondary/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-brand-green" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your Knowledge Base is Empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Build your knowledge base to create better, more consistent proposals. 
              You can start with our comprehensive template or create entries manually.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onGenerateInitial} className="gap-2" size="lg">
              <Sparkles className="w-4 h-4" />
              Generate Initial Knowledge
            </Button>
            <Button onClick={onAddEntry} variant="outline" className="gap-2" size="lg">
              <Upload className="w-4 h-4" />
              Add First Entry
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Initial knowledge generation includes:</p>
            <p>Procedures • Best Practices • Technical Reference • Pricing Guidelines</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
