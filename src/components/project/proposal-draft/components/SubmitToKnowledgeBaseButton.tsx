import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { BookPlus, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { knowledgeCategories } from "@/components/knowledge-base/data/categories";

interface SubmitToKnowledgeBaseButtonProps {
  proposalContent: string;
  projectId: string;
  projectTitle?: string;
}

export function SubmitToKnowledgeBaseButton({
  proposalContent,
  projectId,
  projectTitle,
}: SubmitToKnowledgeBaseButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Past Performance & Case Studies");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleOpen = () => {
    setTitle(`${projectTitle || "Untitled Project"} - Approved Proposal`);
    setCategory("Past Performance & Case Studies");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", user.id)
        .single();

      if (!profile?.current_organization_id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase.from("knowledge_entries").insert({
        title: title.trim(),
        content: proposalContent,
        category,
        user_id: user.id,
        organization_id: profile.current_organization_id,
        parsing_status: "completed",
        parsing_progress: 100,
      });

      if (error) throw error;

      toast.success("Saved to Knowledge Base!", {
        description: "This proposal is now available for future reference.",
        action: {
          label: "View Knowledge Base",
          onClick: () => window.location.assign("/knowledge-base"),
        },
      });
      setHasSaved(true);
      setOpen(false);
    } catch (err) {
      console.error("Failed to save to knowledge base:", err);
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={hasSaved ? undefined : handleOpen}
        className={`flex items-center gap-2 text-xs sm:text-sm ${
          hasSaved 
            ? 'bg-green-600 hover:bg-green-600 text-white border-green-600 cursor-default opacity-90' 
            : 'bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark'
        }`}
        disabled={!proposalContent || hasSaved}
      >
        {hasSaved ? (
          <>
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Saved to KB</span>
            <span className="sm:hidden">Saved</span>
          </>
        ) : (
          <>
            <BookPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Approve & Save</span>
            <span className="sm:hidden">Save</span>
          </>
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save to Knowledge Base</AlertDialogTitle>
            <AlertDialogDescription>
              This proposal will be saved to your Knowledge Base so future proposals can reference your writing style and content.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Entry Title</Label>
              <Input
                id="kb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this entry"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kb-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save to Knowledge Base
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
