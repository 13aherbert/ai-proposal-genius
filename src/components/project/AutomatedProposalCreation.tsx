import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Clock,
  Play,
  Square,
  RotateCcw,
  AlertCircle,
  Zap,
  Info,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useAutomatedProposalCreation, type AutomationStep } from "@/hooks/use-automated-proposal-creation";
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";

interface AutomatedProposalCreationProps {
  projectId: string;
  filePath: string;
}

export interface AutomatedProposalCreationRef {
  startAutomation: () => void;
}

const stepDisplayNames: Record<AutomationStep, string> = {
  analysis: "RFP Analysis",
  outline: "Proposal Outline",
  sections: "Section Creation",
  content: "Content Generation",
  evaluation: "Proposal Evaluation",
  completed: "Completed",
};

const stepDescriptions: Record<AutomationStep, string> = {
  analysis: "Analyzing your RFP document to understand requirements",
  outline: "Generating a comprehensive proposal outline structure",
  sections: "Creating proposal sections from the generated outline",
  content: "Generating AI-powered content for each section",
  evaluation: "Evaluating the completed proposal against RFP requirements",
  completed: "All automation steps completed successfully",
};

function ElapsedTimer({ startTime }: { startTime?: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const origin = startTime ? startTime.getTime() : Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - origin) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span className="tabular-nums">{`${mins}:${secs.toString().padStart(2, "0")}`}</span>;
}

const STEPS: AutomationStep[] = ["analysis", "outline", "sections", "content", "evaluation"];

const AutomatedProposalCreation = forwardRef<AutomatedProposalCreationRef, AutomatedProposalCreationProps>(
  ({ projectId, filePath }, ref) => {
    const { progress, startAutomation, stopAutomation, resetAutomation } =
      useAutomatedProposalCreation(projectId, filePath);

    useImperativeHandle(ref, () => ({ startAutomation }), [startAutomation]);

    const hasStarted = progress.completedSteps.length > 0 || progress.isRunning;
    const isComplete = progress.currentStep === "completed" && progress.completedSteps.length === 5;
    // Collapsed by default once any step has completed and not currently running
    const [open, setOpen] = useState(!hasStarted || progress.isRunning);

    useEffect(() => {
      if (progress.isRunning) setOpen(true);
    }, [progress.isRunning]);

    const stepStatusIcon = (step: AutomationStep) => {
      if (progress.completedSteps.includes(step))
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      if (progress.currentStep === step && progress.isRunning)
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      if (progress.errors.some((e) => e.step === step))
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      return <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/40" />;
    };

    const primaryAction = progress.isRunning ? (
      <Button variant="outline" size="sm" onClick={stopAutomation} className="gap-2">
        <Square className="h-4 w-4" />
        Stop
      </Button>
    ) : (
      <Button
        onClick={startAutomation}
        size="sm"
        className="bg-brand-green hover:bg-brand-green-dark text-white gap-2"
      >
        <Play className="h-4 w-4" />
        {progress.completedSteps.length > 0 ? "Resume" : "Start"}
      </Button>
    );

    return (
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left group">
                <Zap className="h-5 w-5 text-brand-green" />
                <CardTitle className="text-base sm:text-lg">Automated Proposal Creation</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info
                        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Typically 2–5 minutes. Each step builds on the previous one. You can stop
                        and resume anytime. Keep this page open during automation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {progress.isRunning && (
                  <span className="text-xs text-muted-foreground ml-2">
                    <ElapsedTimer startTime={progress.startTime} /> · {progress.overallProgress}%
                  </span>
                )}
                {!progress.isRunning && hasStarted && !isComplete && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {progress.completedSteps.length}/{STEPS.length} steps
                  </Badge>
                )}
                {isComplete && (
                  <Badge className="ml-2 text-xs bg-green-600 hover:bg-green-600">Complete</Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    open ? "rotate-180" : ""
                  } ml-auto`}
                />
              </CollapsibleTrigger>
              <div className="flex items-center gap-1 shrink-0">
                {primaryAction}
                {!progress.isRunning && hasStarted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={resetAutomation} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Reset progress
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {progress.isRunning && (
              <Progress value={progress.overallProgress} className="h-1.5 mt-3" />
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Current Step Highlight */}
              {progress.isRunning && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
                  <Clock className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  <AlertDescription>
                    <div className="font-semibold text-blue-900 dark:text-blue-200">
                      {stepDisplayNames[progress.currentStep]}
                    </div>
                    <div className="text-sm mt-0.5 text-blue-800 dark:text-blue-300">
                      {stepDescriptions[progress.currentStep]}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Steps Overview — compact */}
              <ol className="space-y-1.5">
                {STEPS.map((step) => {
                  const isCurrent = progress.currentStep === step && progress.isRunning;
                  const isDone = progress.completedSteps.includes(step);
                  const hasError = progress.errors.some((e) => e.step === step);
                  return (
                    <li
                      key={step}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                        isCurrent ? "bg-muted" : ""
                      }`}
                    >
                      <div className="w-4 flex justify-center shrink-0">{stepStatusIcon(step)}</div>
                      <span
                        className={`flex-1 ${
                          isDone ? "text-muted-foreground" : "font-medium"
                        }`}
                      >
                        {stepDisplayNames[step]}
                      </span>
                      {hasError && (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ol>

              {/* Errors */}
              {progress.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Errors occurred during automation</div>
                    <ul className="space-y-1">
                      {progress.errors.map((error, i) => (
                        <li key={i} className="text-sm">
                          <strong>{stepDisplayNames[error.step]}:</strong> {error.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Completion */}
              {isComplete && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                    Your proposal has been generated. Open the Proposal tab to review and edit.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }
);

AutomatedProposalCreation.displayName = "AutomatedProposalCreation";

export default AutomatedProposalCreation;
