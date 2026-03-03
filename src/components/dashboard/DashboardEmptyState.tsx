import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Upload, FileText, ArrowDown, ArrowRight,
  CheckCircle, Brain, FileCheck, Check, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardEmptyStateProps {
  profileComplete: boolean;
  hasKnowledgeEntries: boolean;
  hasProjects: boolean;
  knowledgeReadiness: {
    missingEssential: string[];
    essentialScore: number;
  };
  onUploadClick: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending";
  actionUrl: string;
  actionLabel: string;
  reward: string | null;
}

export function DashboardEmptyState({
  profileComplete,
  hasKnowledgeEntries,
  hasProjects,
  knowledgeReadiness,
  onUploadClick,
}: DashboardEmptyStateProps) {
  const checklistItems = useMemo<ChecklistItem[]>(() => {
    const essentialTotal = knowledgeReadiness.missingEssential.length + Math.round((knowledgeReadiness.essentialScore / 100) * (knowledgeReadiness.missingEssential.length / (1 - knowledgeReadiness.essentialScore / 100 || 1)));
    
    return [
      {
        id: "profile",
        title: "Complete Your Profile",
        description: "Add your business information and preferences",
        status: profileComplete ? "completed" : "pending",
        actionUrl: "/account-settings",
        actionLabel: "Add Details",
        reward: null,
      },
      {
        id: "kb",
        title: "Build Knowledge Base",
        description: hasKnowledgeEntries
          ? `${knowledgeReadiness.missingEssential.length} essential categories remaining`
          : "Add your company info to improve proposal quality",
        status: hasKnowledgeEntries
          ? knowledgeReadiness.missingEssential.length === 0
            ? "completed"
            : "in-progress"
          : "pending",
        actionUrl: "/knowledge-base",
        actionLabel: hasKnowledgeEntries ? "Continue Building" : "Get Started",
        reward: "+10% proposal quality",
      },
      {
        id: "first-rfp",
        title: "Create First Proposal",
        description: "Upload an RFP and generate your first AI-powered response",
        status: hasProjects ? "completed" : "pending",
        actionUrl: "/upload-rfp",
        actionLabel: "Upload RFP",
        reward: "🎉 First win!",
      },
    ];
  }, [profileComplete, hasKnowledgeEntries, hasProjects, knowledgeReadiness]);

  const completedCount = checklistItems.filter((i) => i.status === "completed").length;

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
                <Button size="lg" className="w-full sm:w-auto" onClick={onUploadClick}>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Getting Started
            <Badge variant="secondary">{completedCount} of 3 completed</Badge>
          </CardTitle>
          <CardDescription>
            Complete these steps to unlock the full power of OptiRFP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all",
                item.status === "completed" && "bg-accent/30 border-accent",
                item.status === "in-progress" && "bg-secondary/50 border-secondary",
                item.status === "pending" && "bg-muted/50 border-muted"
              )}
            >
              {/* Status Icon */}
              <div className="mt-0.5">
                {item.status === "completed" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                {item.status === "in-progress" && (
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Circle className="w-4 h-4 text-secondary-foreground animate-pulse" />
                  </div>
                )}
                {item.status === "pending" && (
                  <div className="w-6 h-6 bg-muted-foreground/30 rounded-full flex items-center justify-center">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium text-foreground",
                  item.status === "completed" && "text-primary"
                )}>
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>

                {item.status !== "completed" && (
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to={item.actionUrl}>
                      {item.actionLabel}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                )}

                {item.status === "completed" && item.reward && (
                  <Badge variant="secondary" className="mt-3">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {item.reward}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
