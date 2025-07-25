import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, Play, Square, RotateCcw, AlertCircle, Zap } from "lucide-react";
import { useAutomatedProposalCreation, type AutomationStep } from "@/hooks/use-automated-proposal-creation";

interface AutomatedProposalCreationProps {
  projectId: string;
  filePath: string;
}

const stepDisplayNames: Record<AutomationStep, string> = {
  analysis: "RFP Analysis",
  outline: "Proposal Outline",
  sections: "Section Creation",
  content: "Content Generation",
  evaluation: "Proposal Evaluation",
  completed: "Completed"
};

const stepDescriptions: Record<AutomationStep, string> = {
  analysis: "Analyzing your RFP document to understand requirements",
  outline: "Generating a comprehensive proposal outline structure",
  sections: "Creating proposal sections from the generated outline",
  content: "Generating AI-powered content for each section",
  evaluation: "Evaluating the completed proposal against RFP requirements",
  completed: "All automation steps completed successfully"
};

export function AutomatedProposalCreation({ projectId, filePath }: AutomatedProposalCreationProps) {
  const { progress, startAutomation, stopAutomation, resetAutomation } = useAutomatedProposalCreation(projectId, filePath);

  const renderStepStatus = (step: AutomationStep) => {
    if (progress.completedSteps.includes(step)) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (progress.currentStep === step && progress.isRunning) {
      return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
    }
    if (progress.errors.some(error => error.step === step)) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
  };

  const getStepBadgeVariant = (step: AutomationStep) => {
    if (progress.completedSteps.includes(step)) {
      return "default" as const;
    }
    if (progress.currentStep === step && progress.isRunning) {
      return "secondary" as const;
    }
    if (progress.errors.some(error => error.step === step)) {
      return "destructive" as const;
    }
    return "outline" as const;
  };

  const formatTimeRemaining = () => {
    if (!progress.estimatedTimeRemaining) return null;
    const minutes = Math.floor(progress.estimatedTimeRemaining / 60);
    const seconds = progress.estimatedTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-green" />
            <CardTitle className="text-xl">Automated Proposal Creation</CardTitle>
          </div>
          <div className="flex gap-2">
            {!progress.isRunning && progress.completedSteps.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetAutomation}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
            {progress.isRunning ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopAutomation}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button 
                onClick={startAutomation}
                disabled={progress.isRunning}
                className="bg-brand-green hover:bg-brand-green-dark text-white gap-2"
                size="sm"
              >
                <Play className="h-4 w-4" />
                {progress.completedSteps.length > 0 ? 'Resume' : 'Start'} Automation
              </Button>
            )}
          </div>
        </div>
        
        {progress.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overall Progress</span>
              <span>{progress.overallProgress}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-2" />
            {formatTimeRemaining() && (
              <div className="text-xs text-muted-foreground text-center">
                Estimated time remaining: {formatTimeRemaining()}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Step Highlight */}
        {progress.isRunning && (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-700" />
            <AlertDescription>
              <div className="font-semibold text-blue-900">
                {stepDisplayNames[progress.currentStep]}
              </div>
              <div className="text-sm mt-1 text-blue-800">
                {stepDescriptions[progress.currentStep]}
              </div>
              {progress.stepProgress > 0 && (
                <div className="mt-2">
                  <Progress value={progress.stepProgress} className="h-1" />
                  <div className="text-xs text-blue-700 mt-1 font-medium">
                    Step Progress: {progress.stepProgress}%
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Steps Overview */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Process Steps
          </h4>
          
          {(['analysis', 'outline', 'sections', 'content', 'evaluation'] as AutomationStep[]).map((step, index) => (
            <div key={step} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{stepDisplayNames[step]}</span>
                  <Badge variant={getStepBadgeVariant(step)} className="text-xs">
                    {progress.completedSteps.includes(step) ? 'Completed' :
                     progress.currentStep === step && progress.isRunning ? 'In Progress' :
                     progress.errors.some(error => error.step === step) ? 'Failed' : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stepDescriptions[step]}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {renderStepStatus(step)}
              </div>
            </div>
          ))}
        </div>

        {/* Errors Display */}
        {progress.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Errors occurred during automation:</div>
              <ul className="space-y-1">
                {progress.errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <strong>{stepDisplayNames[error.step]}:</strong> {error.message}
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-sm">
                You can retry the automation or continue manually from the project details page.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Completion Status */}
        {progress.currentStep === 'completed' && progress.completedSteps.length === 5 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="font-medium text-green-800">
                🎉 Automation Completed Successfully!
              </div>
              <div className="text-sm text-green-700 mt-1">
                Your complete proposal has been generated and is ready for review. 
                You can now navigate to the project details to review and edit the content.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Information Box */}
        <Alert>
          <AlertDescription className="text-sm">
            <div className="font-medium mb-2">About Automated Proposal Creation</div>
            <ul className="space-y-1 text-xs">
              <li>• This process typically takes 10-15 minutes to complete</li>
              <li>• Each step builds on the previous one for best results</li>
              <li>• You can stop and resume the process at any time</li>
              <li>• Content can be reviewed and edited after generation</li>
              <li>• Keep this page open during the automation process</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}