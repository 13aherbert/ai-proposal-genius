import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSEO } from "@/hooks/use-seo";
import { QuickUploadModal } from "@/components/rfp/QuickUploadModal";
import { useQuickUpload } from "@/hooks/use-quick-upload";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { format } from "date-fns";
import { ArrowRight, Plus, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProgressiveOnboarding } from "@/components/onboarding/ProgressiveOnboarding";
import { useOnboardingFlow } from "@/hooks/use-onboarding-flow";
import { useSubscription } from "@/hooks/use-subscription";
import { normalizePlanType } from "@/hooks/subscription/feature-access";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";

export default function Dashboard() {
  const { session } = useAuth();
  useSEO({ title: "Home | OptiRFP", description: "Your proposals at a glance." });
  const { profileData } = useProfile();
  const navigate = useNavigate();
  const dashboardStats = useDashboardStats();
  const { recentActivity, isLoading: activitiesLoading } = useRecentActivity(session?.user || null);
  const { data: subscriptionData, isLoading: subscriptionLoading } = useSubscription();
  const planType = normalizePlanType(subscriptionData?.plan_type);
  const { getProjectLimit } = useSubscriptionFeatures();
  const projectLimit = getProjectLimit();
  const quickUpload = useQuickUpload();
  const onboarding = useOnboardingFlow();

  const [setupDismissed, setSetupDismissed] = useState(
    () => localStorage.getItem("onboarding_checklist_dismissed") === "true"
  );

  // Listen for reopen-onboarding event from Navbar
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("optirfp_wizard_skipped");
      localStorage.removeItem("optirfp_first_rfp_complete");
      onboarding.reopen();
    };
    window.addEventListener("reopen-onboarding", handler);
    return () => window.removeEventListener("reopen-onboarding", handler);
  }, [onboarding]);

  const firstName = useMemo(() => {
    return (
      profileData.first_name ||
      (session?.user?.user_metadata as any)?.first_name ||
      ""
    );
  }, [profileData.first_name, session]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const profileComplete = !!(profileData.first_name && profileData.last_name && profileData.business_name);
  const isReady = !dashboardStats.isLoading && !subscriptionLoading;
  const isEstablished = dashboardStats.hasProjects || dashboardStats.hasKnowledgeEntries;
  const continueItems = recentActivity
    .filter((a) => a.type === "project")
    .slice(0, 3);

  const setupItems = [
    { label: "Complete your profile", done: profileComplete, action: () => navigate("/account") },
    { label: "Add to your library", done: dashboardStats.hasKnowledgeEntries, action: () => navigate("/knowledge-base") },
    { label: "Start your first proposal", done: dashboardStats.hasProjects, action: () => navigate("/upload-rfp") },
  ];
  const setupRemaining = setupItems.filter((s) => !s.done).length;
  const showSetup = !setupDismissed && setupRemaining > 0 && !isEstablished;

  const planLabel = !planType || planType === "starter" ? "Free plan" : `${planType.charAt(0).toUpperCase()}${planType.slice(1)} plan`;
  const usageText = projectLimit === -1
    ? `${dashboardStats.projectCount} proposals`
    : `${dashboardStats.projectCount} of ${projectLimit} proposals used`;

  if (!isReady) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <ProgressiveOnboarding
        isOpen={onboarding.isOpen}
        currentStep={onboarding.currentStep}
        onNext={onboarding.next}
        onBack={onboarding.back}
        onSkip={onboarding.skip}
        onComplete={onboarding.complete}
        goToStep={onboarding.goToStep}
        setIsOpen={onboarding.setIsOpen}
      />

      <QuickUploadModal
        isOpen={quickUpload.isModalOpen}
        onClose={quickUpload.closeModal}
        step={quickUpload.step}
        progress={quickUpload.progress}
        projectTitle={quickUpload.projectTitle}
        error={quickUpload.error}
        autoGenerate={quickUpload.autoGenerate}
        setAutoGenerate={quickUpload.setAutoGenerate}
        onUpload={quickUpload.uploadAndCreate}
        onViewProject={quickUpload.viewProject}
      />

      {/* Greeting */}
      <header className="space-y-1 pt-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          {greeting}{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground">{planLabel} · {usageText}</p>
      </header>

      {/* Primary action */}
      <section
        onClick={() => quickUpload.openModal()}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors cursor-pointer p-8 md:p-10"
      >
        <div className="flex items-start gap-5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-foreground">Start a proposal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Drop an RFP file and we'll draft your response. PDFs, Word, or text.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all hidden sm:block" />
        </div>
      </section>

      {/* Setup checklist (only while incomplete) */}
      {showSetup && (
        <section className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Get set up</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {setupRemaining} step{setupRemaining === 1 ? "" : "s"} left
              </p>
            </div>
            <button
              onClick={() => {
                setSetupDismissed(true);
                localStorage.setItem("onboarding_checklist_dismissed", "true");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-4 space-y-1">
            {setupItems.map((s, i) => (
              <li key={i}>
                <button
                  onClick={s.action}
                  className="w-full flex items-center gap-3 text-left py-2 px-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                  disabled={s.done}
                >
                  <span
                    className={
                      s.done
                        ? "h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]"
                        : "h-4 w-4 rounded-full border border-muted-foreground/40"
                    }
                  >
                    {s.done ? "✓" : ""}
                  </span>
                  <span className={s.done ? "text-sm text-muted-foreground line-through" : "text-sm text-foreground"}>
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Continue */}
      {isEstablished && continueItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Continue
            </h2>
            <button
              onClick={() => navigate("/projects")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
            {continueItems.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.isUpdate ? "Updated" : "Created"} {format(new Date(p.date), "MMM d")}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty state nudge if no projects and setup dismissed */}
      {!isEstablished && setupDismissed && (
        <div className="text-center py-6">
          <Button variant="outline" onClick={() => navigate("/upload-rfp")}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first proposal
          </Button>
        </div>
      )}
    </div>
  );
}
