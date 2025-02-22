
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProposalSections } from "./useProposalSections";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { CompiledView } from "./components/CompiledView";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
  mode?: 'draft' | 'compiled';
}

export function ProposalDraft({ projectId, outline, mode = 'draft' }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const { sections, isLoading, error, addSection, reorderSections, deleteAllSections } = useProposalSections(projectId);

  const handleAddSection = (title: string) => {
    addSection(title);
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const handleDeleteAll = () => {
    setIsDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = () => {
    deleteAllSections();
    setIsDeleteAllDialogOpen(false);
  };

  if (mode === 'compiled') {
    return <CompiledView sections={sections} />;
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-start flex-1">
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                  Proposal Draft
                </CardTitle>
                <CardDescription className="pt-2">
                  Create and manage your proposal sections
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
                <AddSectionButton onAdd={handleAddSection} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionsList
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onReorderSections={reorderSections}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all sections?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all sections
              and their content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
