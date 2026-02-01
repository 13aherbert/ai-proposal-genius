import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  FileText,
  ArrowRight,
  Building2,
  Users,
  Trophy,
  Wrench,
  DollarSign,
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { enhancedKnowledgeCategories, getEssentialCategories } from "@/components/knowledge-base/data/categories";
import { useKnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import { cn } from "@/lib/utils";

interface KnowledgeSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Company Overview & Mission": <Building2 className="h-5 w-5" />,
  "Team Bios & Qualifications": <Users className="h-5 w-5" />,
  "Past Performance & Case Studies": <Trophy className="h-5 w-5" />,
  "Technical Capabilities": <Wrench className="h-5 w-5" />,
  "Pricing & Rates": <DollarSign className="h-5 w-5" />,
  "Differentiators & Value Props": <Star className="h-5 w-5" />,
};

export function KnowledgeSetupWizard({ open, onOpenChange }: KnowledgeSetupWizardProps) {
  const navigate = useNavigate();
  const readiness = useKnowledgeReadiness();
  const [currentStep, setCurrentStep] = useState(0);
  
  const essentialCategories = getEssentialCategories();
  const totalSteps = essentialCategories.length + 1; // +1 for intro

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAddContent = (categoryName: string) => {
    onOpenChange(false);
    // Navigate to knowledge base with category pre-selected
    navigate(`/knowledge-base?category=${encodeURIComponent(categoryName)}&action=add`);
  };

  const handleSkipToKB = () => {
    onOpenChange(false);
    navigate('/knowledge-base');
  };

  const progress = (currentStep / (totalSteps - 1)) * 100;

  // Intro step
  if (currentStep === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Set Up Your Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Your knowledge base is the foundation for winning proposals. Let's add the essential information the AI needs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-primary mb-1">6</div>
                  <div className="text-sm text-muted-foreground">Essential Categories</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Required for quality proposals
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {6 - readiness.missingEssential.length}/6
                  </div>
                  <div className="text-sm text-muted-foreground">Already Completed</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {readiness.missingEssential.length === 0 ? "All set!" : `${readiness.missingEssential.length} remaining`}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Essential Categories Overview:</div>
              <div className="grid grid-cols-2 gap-2">
                {essentialCategories.map((category) => {
                  const isComplete = !readiness.missingEssential.includes(category.name);
                  return (
                    <div 
                      key={category.name}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md text-sm",
                        isComplete ? "bg-green-50 text-green-700" : "bg-muted"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{category.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium text-sm">AI-Powered Assistance</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    For each category, you can write content manually, upload documents, or use AI to generate starter content based on prompts.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={handleSkipToKB}>
              Skip to Knowledge Base
            </Button>
            <Button onClick={handleNext}>
              Start Setup
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Category steps
  const categoryIndex = currentStep - 1;
  const currentCategory = essentialCategories[categoryIndex];
  const isComplete = !readiness.missingEssential.includes(currentCategory.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">Step {currentStep} of {totalSteps - 1}</Badge>
            <Badge variant={isComplete ? "default" : "secondary"} className={isComplete ? "bg-green-600" : ""}>
              {isComplete ? "Complete" : "Missing"}
            </Badge>
          </div>
          <DialogTitle className="text-xl flex items-center gap-2">
            {categoryIcons[currentCategory.name]}
            {currentCategory.name}
          </DialogTitle>
          <DialogDescription>
            {currentCategory.description}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1" />

        <div className="space-y-4 py-4">
          <div className="text-sm font-medium">Used in proposal sections:</div>
          <div className="flex flex-wrap gap-2">
            {currentCategory.proposalMapping.map((section) => (
              <Badge key={section} variant="outline">
                {section}
              </Badge>
            ))}
          </div>

          <div className="text-sm font-medium mt-4">What to include:</div>
          <div className="grid grid-cols-2 gap-2">
            {currentCategory.samplePrompts.map((prompt, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-sm"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span>{prompt}</span>
              </div>
            ))}
          </div>

          {isComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">You have content in this category!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You can still add more entries to improve proposal quality.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">No content yet in this category</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                Add content now to improve your proposal quality, or continue and add later.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant={isComplete ? "outline" : "default"}
              onClick={() => handleAddContent(currentCategory.name)}
            >
              {isComplete ? "Add More" : "Add Content"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button variant="ghost" onClick={handleNext}>
                {isComplete ? "Next" : "Skip"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSkipToKB}>
                Finish
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
