
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface SectionCreationButtonProps {
  proposalOutline: string | null;
  sectionsCount: number;
  onCreateSections: (titles: string[]) => Promise<void>;
  extractSectionTitles: (outline: string) => string[];
}

export function SectionCreationButton({
  proposalOutline,
  sectionsCount,
  onCreateSections,
  extractSectionTitles,
}: SectionCreationButtonProps) {
  const [isCreatingSections, setIsCreatingSections] = useState(false);

  const handleCreateSectionsFromOutline = async () => {
    if (!proposalOutline) {
      toast.error("No proposal outline found", {
        description: "Please generate a proposal outline first before creating sections."
      });
      return;
    }

    setIsCreatingSections(true);
    toast.loading("Creating sections from outline...");

    try {
      const sectionTitles = extractSectionTitles(proposalOutline);
      
      if (sectionTitles.length === 0) {
        toast.dismiss();
        toast.error("No valid section titles found in outline", {
          description: "The outline may not be in the expected format."
        });
        return;
      }

      await onCreateSections(sectionTitles);

      toast.dismiss();
    } catch (error) {
      console.error('Error creating sections from outline:', error);
      toast.dismiss();
      toast.error("Failed to create sections", {
        description: "Please try again or create sections manually."
      });
    } finally {
      setIsCreatingSections(false);
    }
  };

  if (!proposalOutline || sectionsCount > 0) {
    return null;
  }

  return (
    <Button
      onClick={handleCreateSectionsFromOutline}
      disabled={isCreatingSections}
      variant="outline"
      className="flex-1 sm:flex-none"
    >
      {isCreatingSections ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Sections...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Create Sections from Outline
        </>
      )}
    </Button>
  );
}
