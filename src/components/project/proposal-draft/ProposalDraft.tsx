
import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, MoreVertical, FileText, MessageSquare } from "lucide-react";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { SectionCreationButton } from "./components/SectionCreationButton";
import { ContentGenerationButton } from "./components/ContentGenerationButton";
import { CompiledView } from "./components/CompiledView";
import { GlobalSaveStatus } from "./components/GlobalSaveStatus";
import { ProposalProgress } from "./components/ProposalProgress";
import { useProposalSections } from "./useProposalSections";
import { useProposalOutline } from "./hooks/useProposalOutline";
import { useProposalComments } from "@/hooks/useProposalComments";
import { BackupManager } from "./BackupManager";
import { CommentSidebar } from "@/components/project/comments";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SaveStatus } from "@/hooks/use-auto-save";
import { countWords } from "@/utils/wordCount";
import { useAuth } from "@/components/AuthProvider";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { WorkflowStatus } from "./hooks/useSectionWorkflow";

export interface ProposalDraftProps {
  projectId: string;
  mode?: "draft" | "compiled";
}

export function ProposalDraft({ projectId, mode = "draft" }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SaveStatus>>({});
  const [commentSidebarOpen, setCommentSidebarOpen] = useState(false);
  const [commentSectionId, setCommentSectionId] = useState<string | undefined>();
  const [pendingComment, setPendingComment] = useState<{ sectionId: string; quotedText: string; from: number; to: number } | null>(null);
  const [filter, setFilter] = useState<{ status: WorkflowStatus | null; assignee: string | null; myOnly: boolean }>({
    status: null,
    assignee: null,
    myOnly: false,
  });

  const { session } = useAuth();
  const { plan } = useSubscriptionFeatures();

  const {
    sections,
    isLoading,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
    deleteAllSections,
  } = useProposalSections(projectId);

  const { proposalOutline, extractSectionTitles } = useProposalOutline(projectId);
  const { comments: allComments, addComment } = useProposalComments(projectId);
  const openCommentCount = allComments.filter(c => !c.is_resolved).length;

  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

  const { members } = useOrganizationMembers(orgId);
  const showTeamFeatures = plan !== "starter" && members.length > 1;

  const membersList = useMemo(() =>
    members.map(m => ({
      user_id: m.user_id,
      first_name: m.first_name,
      last_name: m.last_name,
      username: m.username,
      role: m.role,
      avatar_url: m.avatar_url,
    })),
    [members]
  );

  const handleCommentFromEditor = useCallback((sectionId: string, quotedText: string, from: number, to: number) => {
    setCommentSidebarOpen(true);
    setCommentSectionId(sectionId);
    setPendingComment({ sectionId, quotedText, from, to });
  }, []);

  // Filtered sections — always start from outline order (sort_order ASC)
  const filteredSections = useMemo(() => {
    let result = [...sections].sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    if (filter.status) {
      result = result.filter(s => (s.workflow_status || "draft") === filter.status);
    }
    if (filter.myOnly && session?.user?.id) {
      result = result.filter(s => s.assigned_to === session.user.id);
    }
    return result;
  }, [sections, filter, session?.user?.id]);

  const statusValues = Object.values(sectionStatuses);
  const hasUnsaved = statusValues.some(s => s === "unsaved" || s === "saving");

  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const handleSaveStatusChange = useCallback((sectionId: string, status: SaveStatus) => {
    setSectionStatuses(prev => ({ ...prev, [sectionId]: status }));
  }, []);

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const handleCreateSections = async (titles: string[]) => {
    try {
      for (const title of titles) {
        await addSection(title, true);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast.success(`Created ${titles.length} sections from outline`, {
        description: "You can now start adding content to each section."
      });
    } catch (error) {
      console.error('Error creating sections:', error);
      toast.error("Failed to create some sections");
    }
  };

  const handleUpdateSection = async (sectionId: string, content: string, title: string): Promise<void> => {
    return new Promise((resolve) => {
      updateSection(sectionId, content, title);
      resolve();
    });
  };

  const handleDeleteAllSections = () => {
    if (sections.length === 0) {
      toast.error("No sections to delete");
      return;
    }
    toast.warning(`Delete all ${sections.length} sections?`, {
      description: "This action cannot be undone. A backup will be created automatically.",
      action: { label: "Delete All", onClick: () => deleteAllSections() }
    });
  };

  if (mode === "compiled") {
    return <CompiledView sections={sections} projectId={projectId} />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl sm:text-2xl font-semibold">Proposal Draft</CardTitle>
            {sections.length > 0 && <GlobalSaveStatus sectionStatuses={statusValues} />}
          </div>
          <CardDescription className="flex flex-wrap items-center gap-3">
            <span>Create and edit sections for your proposal</span>
            {sections.length > 0 && (() => {
              const totalWords = sections.reduce((sum, s) => sum + countWords(s.content || ""), 0);
              const pages = Math.ceil(totalWords / 250);
              const readMin = Math.ceil(totalWords / 200);
              return (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Total: {totalWords.toLocaleString()} words · ~{pages} page{pages !== 1 ? "s" : ""} · ~{readMin} min read
                </span>
              );
            })()}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={commentSidebarOpen ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setCommentSidebarOpen(!commentSidebarOpen)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comments{openCommentCount > 0 ? ` (${openCommentCount})` : ""}
          </Button>
          <BackupManager sections={sections} projectId={projectId} />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {sections.length > 0 && (
              <ProposalProgress
                sections={sections}
                currentUserId={session?.user?.id}
                filter={filter}
                onFilterChange={setFilter}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <AddSectionButton onAdd={addSection} />
              <SectionCreationButton
                proposalOutline={proposalOutline}
                sectionsCount={sections.length}
                onCreateSections={handleCreateSections}
                extractSectionTitles={extractSectionTitles}
              />
              <ContentGenerationButton
                sections={sections}
                projectId={projectId}
                onUpdateSection={handleUpdateSection}
              />
              {sections.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="flex-none">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem
                      onClick={handleDeleteAllSections}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All Sections
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <SectionsList
              sections={filteredSections}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onReorderSections={reorderSections}
              isLoading={isLoading}
              onSaveStatusChange={handleSaveStatusChange}
              members={membersList}
              showTeamFeatures={showTeamFeatures}
              onComment={handleCommentFromEditor}
            />
          </div>
        )}
      </CardContent>

      <CommentSidebar
        projectId={projectId}
        sectionId={commentSectionId}
        open={commentSidebarOpen}
        onClose={() => setCommentSidebarOpen(false)}
        members={membersList}
      />
    </Card>
  );
}

export default ProposalDraft;
