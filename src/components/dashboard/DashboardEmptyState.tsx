import { useMemo, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Upload, FileText, ArrowDown, ArrowRight,
  CheckCircle, Brain, FileCheck, Check, Circle, Loader2,
  Rocket, HelpCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface DashboardEmptyStateProps {
  profileComplete: boolean;
  hasKnowledgeEntries: boolean;
  hasProjects: boolean;
  knowledgeReadiness: {
    missingEssential: string[];
    essentialScore: number;
  };
  onUploadClick: () => void;
  onWizardOpen?: () => void;
  onDismiss?: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  actionUrl: string;
  actionLabel: string;
  completedText: string;
}

export function DashboardEmptyState({
  profileComplete,
  hasKnowledgeEntries,
  hasProjects,
  knowledgeReadiness,
  onUploadClick,
  onWizardOpen,
  onDismiss,
}: DashboardEmptyStateProps) {
  const checklistItems = useMemo<ChecklistItem[]>(() => {
    return [
      {
        id: "profile",
        title: "Complete Your Profile",
        description: "Add your business details to personalize your proposals",
        status: profileComplete ? "completed" : "pending",
        actionUrl: "/account-settings",
        actionLabel: "Complete Profile",
        completedText: "Profile complete!",
      },
      {
        id: "kb",
        title: "Build Your Knowledge Base",
        description: hasKnowledgeEntries
          ? `${knowledgeReadiness.missingEssential.length} essential categories remaining`
          : "Add key company info that powers AI-generated responses",
        status: hasKnowledgeEntries
          ? knowledgeReadiness.missingEssential.length === 0
            ? "completed"
            : "in-progress"
          : "pending",
        actionUrl: "/knowledge-base",
        actionLabel: hasKnowledgeEntries ? "Continue Building" : "Add First Entry",
        completedText: "Knowledge Base started!",
      },
      {
        id: "first-rfp",
        title: "Create Your First Proposal",
        description: "Upload an RFP and see the AI magic in action",
        status: hasProjects ? "completed" : "pending",
        actionUrl: "/upload-rfp",
        actionLabel: "Upload RFP",
        completedText: "First proposal created!",
      },
    ];
  }, [profileComplete, hasKnowledgeEntries, hasProjects, knowledgeReadiness]);

  const completedCount = checklistItems.filter((i) => i.status === "completed").length;
  const progress = (completedCount / checklistItems.length) * 100;
  const allCompleted = completedCount === checklistItems.length;

  // Find the first incomplete item index (the "current" step)
  const currentIndex = checklistItems.findIndex((i) => i.status !== "completed");

  // Track per-step confetti
  const prevCompletedRef = useRef(completedCount);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (completedCount > prevCompletedRef.current) {
      // Per-step mini confetti
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount]);

  useEffect(() => {
    if (allCompleted && !celebrated) {
      setCelebrated(true);
      // Big celebration confetti
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      }, 300);
    }
  }, [allCompleted, celebrated]);

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="relative z-10 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <Badge variant="secondary" className="w-fit">
                <Sparkles className="mr-1 h-3 w-3" />
                AI-Powered
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Create your first AI-powered proposal in 3 minutes
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Upload an RFP document and let OptiRFP generate a complete,
                professional response tailored to your business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto" onClick={onWizardOpen ?? onUploadClick}>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Your First RFP
                </Button>

                <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                  <Link to="/upload-rfp?sample=true">
                    <FileText className="mr-2 h-5 w-5" />
                    Try with Sample RFP
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Supports PDF, DOCX, and TXT files up to 50MB
              </p>
            </div>

            {/* Right: Illustration */}
            <div className="hidden lg:block">
              <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <ArrowDown className="w-8 h-8 text-primary mx-auto" />
                  <div className="w-20 h-20 bg-accent/30 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                  <ArrowDown className="w-8 h-8 text-primary mx-auto" />
                  <div className="w-20 h-20 bg-accent/50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Steps */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Upload, title: "1. Upload RFP", desc: "Drag & drop or browse to select your RFP document" },
          { icon: Brain, title: "2. AI Analyzes", desc: "Identifies requirements, criteria, and key sections" },
          { icon: FileCheck, title: "3. Get Proposal", desc: "Receive a complete, professional response" },
        ].map((step) => (
          <Card key={step.title} className="border-0 shadow-none bg-muted/50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started Checklist */}
      <Card className={cn(
        "transition-all duration-500",
        allCompleted && "border-accent ring-2 ring-accent/20"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {allCompleted ? (
                  <Rocket className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
                Getting Started
                {allCompleted ? (
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Complete!
                  </Badge>
                ) : (
                  <Badge variant="secondary">{completedCount} of 3 completed</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {allCompleted
                  ? "🎉 You're ready to win more RFPs!"
                  : "Complete these 3 essential steps to maximize your success with OptiRFP"}
              </CardDescription>
            </div>
          </div>
          {/* Segmented progress bar */}
          <div className="mt-4 flex gap-2">
            {checklistItems.map((item, i) => (
              <div key={item.id} className="flex-1">
                <div className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  item.status === "completed" && "bg-primary",
                  item.status === "in-progress" && "bg-primary/50 animate-pulse",
                  item.status === "pending" && "bg-muted"
                )} />
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklistItems.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isPending = item.status === "pending" && !isCurrent;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 transition-all animate-fade-in",
                  item.status === "completed" && "bg-accent/20 border-accent/50 opacity-60",
                  item.status === "in-progress" && "bg-primary/5 border-primary/30 ring-2 ring-primary/20",
                  isCurrent && item.status === "pending" && "bg-primary/5 border-primary/30 ring-2 ring-primary/20",
                  isPending && "bg-muted/30 border-muted"
                )}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
              >
                {/* Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {item.status === "completed" && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  {item.status === "in-progress" && (
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  )}
                  {item.status === "pending" && (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isCurrent ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Circle className={cn(
                        "w-4 h-4",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-medium",
                    item.status === "completed" && "line-through text-muted-foreground",
                    (isCurrent || item.status === "in-progress") && "text-foreground font-semibold",
                    isPending && "text-muted-foreground"
                  )}>
                    {item.title}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1",
                    isPending ? "text-muted-foreground/60" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>

                  {item.status === "completed" && (
                    <Badge variant="secondary" className="mt-3">
                      <CheckCircle className="mr-1 h-3 w-3 text-primary" />
                      {item.completedText}
                    </Badge>
                  )}

                  {item.status !== "completed" && (
                    <Button
                      variant={isCurrent || item.status === "in-progress" ? "default" : "outline"}
                      className="mt-3"
                      asChild
                    >
                      <Link to={item.actionUrl}>
                        {item.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* All Complete CTA */}
          {allCompleted && (
            <div className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You've completed all the essential setup steps. Start creating proposals that close deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="flex-1" asChild>
                  <Link to="/upload-rfp">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create New Proposal
                  </Link>
                </Button>
                {onDismiss && (
                  <Button variant="ghost" size="lg" onClick={onDismiss}>
                    <X className="mr-2 h-4 w-4" />
                    Dismiss checklist
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            <span>Need help?</span>
            <a
              href="https://docs.optirfp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View documentation
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
