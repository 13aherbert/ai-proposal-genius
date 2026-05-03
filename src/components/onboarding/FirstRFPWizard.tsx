import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Circle,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useQuickUpload } from "@/hooks/use-quick-upload";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { id: "welcome", title: "Welcome", description: "Get started" },
  { id: "upload", title: "Upload", description: "Select your RFP" },
  { id: "processing", title: "Processing", description: "AI at work" },
] as const;

interface FirstRFPWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FirstRFPWizard({ open, onOpenChange }: FirstRFPWizardProps) {
  // Safety net: clean up pointer-events on unmount
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('pointer-events');
    };
  }, []);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const navigate = useNavigate();
  const quickUpload = useQuickUpload();
  const { trackEvent } = useAnalytics();
  const { session } = useAuth();
  const trackedStart = useRef(false);

  // Track wizard opened
  useEffect(() => {
    if (open && !trackedStart.current) {
      trackEvent("first_rfp_wizard_started", {});
      trackedStart.current = true;
    }
    if (!open) trackedStart.current = false;
  }, [open, trackEvent]);

  // Monitor quick upload completion
  useEffect(() => {
    if (quickUpload.step === "complete" && currentStep === 2) {
      handleComplete();
    }
  }, [quickUpload.step, currentStep]);

  // Simulated progress for sample RFPs
  useEffect(() => {
    if (!isSimulating) return;
    const intervals = [25, 50, 75, 100];
    const timers = intervals.map((val, i) =>
      setTimeout(() => {
        setSimulatedProgress(val);
        if (val === 100) {
          setIsSimulating(false);
          handleComplete();
        }
      }, (i + 1) * 1500)
    );
    return () => timers.forEach(clearTimeout);
  }, [isSimulating]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    trackEvent("first_rfp_wizard_completed", {});
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
  }, [trackEvent]);

  const handleFileSelect = useCallback(
    (file: File) => {
      trackEvent("first_rfp_upload_method", { method: "file" });
      setCurrentStep(2);
      quickUpload.uploadAndCreate(file);
    },
    [quickUpload, trackEvent]
  );

  const handleSampleSelect = useCallback(
    (sampleId: string) => {
      trackEvent("first_rfp_upload_method", { method: "sample", sample_id: sampleId });
      setCurrentStep(2);
      setIsSimulating(true);
      setSimulatedProgress(0);
    },
    [trackEvent]
  );

  const persistDismissal = useCallback(
    async (reason: "skipped" | "dismissed") => {
      localStorage.setItem("optirfp_wizard_skipped", "true");
      trackEvent("first_rfp_wizard_skipped", { reason });
      const userId = session?.user?.id;
      if (userId) {
        try {
          await supabase
            .from("profiles")
            .update({ onboarding_skipped_at: new Date().toISOString() })
            .eq("profile_id", userId);
        } catch (err) {
          console.error("Failed to persist wizard dismissal", err);
        }
      }
    },
    [session, trackEvent]
  );

  const handleSkip = useCallback(() => {
    void persistDismissal("skipped");
    onOpenChange(false);
  }, [onOpenChange, persistDismissal]);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isComplete) {
        void persistDismissal("dismissed");
      }
      onOpenChange(nextOpen);
    },
    [isComplete, onOpenChange, persistDismissal]
  );

  const handleFinish = useCallback(() => {
    localStorage.setItem("optirfp_first_rfp_complete", "true");
    onOpenChange(false);
    if (quickUpload.projectId) {
      navigate(`/projects/${quickUpload.projectId}`);
    } else {
      navigate("/upload-rfp");
    }
  }, [onOpenChange, navigate, quickUpload.projectId]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsComplete(false);
    setSimulatedProgress(0);
    setIsSimulating(false);
    quickUpload.reset();
  }, [quickUpload]);

  const progress =
    currentStep === 2
      ? isSimulating
        ? simulatedProgress
        : quickUpload.progress
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {!isComplete ? (
          <>
            {/* Header with progress */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <DialogHeader className="space-y-0">
                  <DialogTitle className="text-lg">
                    {STEPS[currentStep].title}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Step {currentStep + 1} of {STEPS.length}
                  </DialogDescription>
                </DialogHeader>
              </div>
              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      i <= currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-6">
              {currentStep === 0 && (
                <WelcomeStep
                  onNext={() => {
                    trackEvent("first_rfp_wizard_step_1_complete", {});
                    setCurrentStep(1);
                  }}
                  onSkip={handleSkip}
                />
              )}
              {currentStep === 1 && (
                <UploadStep
                  onFileSelect={handleFileSelect}
                  onSampleSelect={handleSampleSelect}
                  onBack={() => setCurrentStep(0)}
                />
              )}
              {currentStep === 2 && (
                <ProcessingStep progress={progress} />
              )}
            </div>
          </>
        ) : (
          <div className="px-6 py-8">
            <SuccessScreen
              onComplete={handleFinish}
              onCreateAnother={handleReset}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step 1: Welcome ─── */
function WelcomeStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Let's create your first proposal
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          This takes about 3 minutes. We'll guide you through uploading your
          first RFP and generating an AI-powered response.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button size="lg" onClick={onNext} className="w-full">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Explore Dashboard First
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Upload ─── */
function UploadStep({
  onFileSelect,
  onSampleSelect,
  onBack,
}: {
  onFileSelect: (file: File) => void;
  onSampleSelect: (sampleId: string) => void;
  onBack: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const samples = [
    { id: "it-services", title: "IT Services RFP", description: "Managed services, cloud migration" },
    { id: "construction", title: "Construction Project", description: "Commercial building, renovation" },
    { id: "consulting", title: "Consulting Services", description: "Strategy, implementation" },
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("wizard-file-input")?.click()}
      >
        <div className="space-y-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium text-foreground">
            Drag & drop your RFP here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse (PDF, DOCX, TXT up to 50MB)
          </p>
        </div>
        <input
          id="wizard-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      </div>

      {/* Sample RFPs */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Or try with a sample:
        </p>
        <div className="grid gap-2">
          {samples.map((sample) => (
            <Card
              key={sample.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSampleSelect(sample.id)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {sample.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sample.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}

/* ─── Step 3: Processing ─── */
function ProcessingStep({ progress }: { progress: number }) {
  const steps = [
    { label: "Analyzing RFP requirements", threshold: 25 },
    { label: "Matching with Knowledge Base", threshold: 50 },
    { label: "Drafting proposal sections", threshold: 75 },
    { label: "Formatting output", threshold: 100 },
  ];

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">
          OptiRFP is analyzing your RFP
        </h3>
        <p className="text-sm text-muted-foreground">
          This usually takes 2-3 minutes
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-3 text-left">
        {steps.map((step) => {
          const completed = progress >= step.threshold;
          const active =
            !completed &&
            progress >= (step.threshold - 25) &&
            progress < step.threshold;
          return (
            <div key={step.label} className="flex items-center gap-3">
              {completed ? (
                <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              ) : active ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm",
                  completed
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Success Screen ─── */
function SuccessScreen({
  onComplete,
  onCreateAnother,
}: {
  onComplete: () => void;
  onCreateAnother: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Your first proposal is ready! 🎉
        </h2>
        <p className="text-muted-foreground">
          We've generated a complete AI-powered response based on your RFP.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">2:34</p>
            <p className="text-xs text-muted-foreground">Generated in</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">29.5 hrs</p>
            <p className="text-xs text-muted-foreground">Time saved vs manual</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button size="lg" onClick={onComplete} className="w-full">
          Edit & Export
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCreateAnother}>
          Create Another
        </Button>
      </div>
    </div>
  );
}
