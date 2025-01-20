import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, Edit, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { KnowledgeCategory } from "./types";

interface ViewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  category: string;
  categories: KnowledgeCategory[];
  onEntryUpdated: () => void;
}

export const ViewEntryDialog = ({
  open,
  onOpenChange,
  title: initialTitle,
  category: initialCategory,
  categories,
  onEntryUpdated,
}: ViewEntryDialogProps) => {
  const [content, setContent] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedCategory, setEditedCategory] = useState(initialCategory);
  const [editedContent, setEditedContent] = useState<string>("");
  const { toast } = useToast();

  const fetchEntryContent = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('content, file_path')
        .eq('title', initialTitle)
        .single();

      if (error) throw error;
      setContent(data.content);
      setEditedContent(data.content || "");
      setFilePath(data.file_path);
    } catch (error) {
      console.error('Error fetching entry content:', error);
      toast({
        title: "Error",
        description: "Failed to load entry content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('knowledge_entries')
        .update({
          title: editedTitle,
          category: editedCategory.toLowerCase().replace(/\s+/g, '-'),
          content: filePath ? null : editedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('title', initialTitle);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
      
      setIsEditing(false);
      onEntryUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!filePath) return;

    try {
      const { data, error } = await supabase.storage
        .from('knowledge-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchEntryContent();
      setEditedTitle(initialTitle);
      setEditedCategory(initialCategory);
      setIsEditing(false);
    }
  }, [open, initialTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          {isEditing ? (
            <div className="flex-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-1"
              />
            </div>
          ) : (
            <DialogTitle>{initialTitle}</DialogTitle>
          )}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editedCategory}
                  onValueChange={setEditedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium">Category:</span>
                <span className="ml-2 text-sm text-muted-foreground">{initialCategory}</span>
              </div>
            )}
          </div>
          {isLoading ? (
            <p className="text-muted-foreground">Loading content...</p>
          ) : filePath ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">This entry contains an uploaded document</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[200px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {content || "No content available"}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};