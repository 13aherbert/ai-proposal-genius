import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useCSMContact } from "@/hooks/use-csm-contact";
import { supabase } from "@/integrations/supabase/client";
import { BrandingEditor } from "@/components/branding/BrandingEditor";
import { AssetUploader } from "@/components/organization/AssetUploader";
import { DomainManager } from "@/components/organization/DomainManager";
import { ApiKeyManagement } from "@/components/organization/ApiKeyManagement";
import { toast } from "sonner";

type StepId = "welcome" | "branding" | "assets" | "domain" | "team" | "api" | "done";

interface Step {
  id: StepId;
  title: string;
  description: string;
  whiteLabelOnly?: boolean;
}

const ALL_STEPS: Step[] = [
  { id: "welcome", title: "Welcome", description: "Meet your CSM and confirm your plan." },
  { id: "branding", title: "Branding", description: "Logo, colors, and typography.", whiteLabelOnly: true },
  { id: "assets", title: "Assets", description: "Upload logos and favicons.", whiteLabelOnly: true },
  { id: "domain", title: "Custom domain", description: "Point a domain at your portal.", whiteLabelOnly: true },
  { id: "team", title: "Invite team", description: "Add teammates and assign roles." },
  { id: "api", title: "API access", description: "Generate organization API keys.", whiteLabelOnly: true },
  { id: "done", title: "All set", description: "Review your setup." },
];

export default function EnterpriseOnboarding() {
  const { organization, loading, refreshOrganization } = useCurrentOrganization();
  const { csm } = useCSMContact();
  const [activeId, setActiveId] = useState<StepId>("welcome");
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  const isWhiteLabel = organization?.is_white_label || organization?.subscription_tier === "white_label";
  const isEnterprise = organization?.subscription_tier === "enterprise" || isWhiteLabel;

  const steps = useMemo(
    () => ALL_STEPS.filter((s) => !s.whiteLabelOnly || isWhiteLabel),
    [isWhiteLabel],
  );

  useEffect(() => {
    if (organization?.settings && typeof organization.settings === "object") {
      const sp = (organization.settings as Record<string, unknown>).setup_progress;
      if (sp && typeof sp === "object") setProgress(sp as Record<string, boolean>);
    }
  }, [organization?.id]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!organization) return <Navigate to="/dashboard" replace />;
  if (!isEnterprise) {
    return (
      <Card className="max-w-xl mx-auto mt-12">
        <CardHeader>
          <CardTitle>Enterprise onboarding</CardTitle>
          <CardDescription>This wizard is for Enterprise and White-Label organizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link to="/dashboard">Back to dashboard</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const completedCount = steps.filter((s) => progress[s.id]).length;
  const pct = Math.round((completedCount / steps.length) * 100);

  const markComplete = async (id: StepId) => {
    const next = { ...progress, [id]: true };
    setProgress(next);
    const settings = { ...(organization.settings || {}), setup_progress: next };
    const { error } = await supabase
      .from("organizations")
      .update({ settings })
      .eq("id", organization.id);
    if (error) { toast.error("Could not save progress"); return; }
    refreshOrganization();
  };

  const advance = async () => {
    await markComplete(activeId);
    const idx = steps.findIndex((s) => s.id === activeId);
    if (idx < steps.length - 1) setActiveId(steps[idx + 1].id);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {organization.name}</h1>
            <Badge variant="secondary">{isWhiteLabel ? "White-Label" : "Enterprise"}</Badge>
          </div>
          <p className="text-muted-foreground">Complete the steps below to finish your setup.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{completedCount} / {steps.length} complete</p>
          <Progress value={pct} className="w-40 mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <Card>
          <CardContent className="p-2">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2 transition-colors ${
                  activeId === s.id ? "bg-muted font-medium" : "hover:bg-muted/60"
                }`}
              >
                <span className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center text-xs ${
                  progress[s.id] ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                }`}>
                  {progress[s.id] ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="flex-1 text-sm">{s.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{steps.find((s) => s.id === activeId)?.title}</CardTitle>
            <CardDescription>{steps.find((s) => s.id === activeId)?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeId === "welcome" && (
              <div className="space-y-3">
                <div className="rounded-lg border p-4 bg-muted/30">
                  <p className="text-sm font-semibold">Your Customer Success Manager</p>
                  <p className="text-sm">{csm.name} · <a className="underline" href={`mailto:${csm.email}`}>{csm.email}</a></p>
                  {csm.phone && <p className="text-sm">{csm.phone}</p>}
                  {csm.calendlyUrl && (
                    <Button asChild size="sm" className="mt-3">
                      <a href={csm.calendlyUrl} target="_blank" rel="noreferrer">Schedule kickoff call</a>
                    </Button>
                  )}
                </div>
              </div>
            )}
            {activeId === "branding" && <BrandingEditor />}
            {activeId === "assets" && (
              <AssetUploader onAssetUploaded={() => toast.success("Asset uploaded")} />
            )}
            {activeId === "domain" && <DomainManager />}
            {activeId === "team" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Invite teammates from the Team page. Role templates: Admin, Manager, Editor, Reviewer, Viewer.</p>
                <Button asChild><Link to="/team">Open Team management</Link></Button>
              </div>
            )}
            {activeId === "api" && <ApiKeyManagement />}
            {activeId === "done" && (
              <div className="space-y-3">
                <p className="text-sm">All required steps completed. You can revisit any section from this checklist.</p>
                <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
              </div>
            )}

            {activeId !== "done" && (
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={advance}>
                  Mark complete & continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
