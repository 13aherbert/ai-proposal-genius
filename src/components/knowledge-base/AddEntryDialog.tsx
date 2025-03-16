
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, PenLine, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AddEntryDialogProps } from "./entry-dialog/types";
import { FileUpload } from "./entry-dialog/FileUpload";
import { useEntryForm } from "./entry-dialog/useEntryForm";
import { useState } from "react";
import { AIGenerator } from "./entry-dialog/AIGenerator";

export const AddEntryDialog = ({ categories, open, onOpenChange }: AddEntryDialogProps) => {
  const { session } = useAuth();
  const [contentMode, setContentMode] = useState<'manual' | 'upload' | 'ai'>('manual');
  
  const {
    formData,
    setTitle,
    setCategory,
    setContent,
    setSelectedFile,
    isSubmitting,
    handleSubmit,
  } = useEntryForm(() => onOpenChange(false));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      return;
    }
    await handleSubmit(session.user.id);
  };

  const handleGeneratedContent = (title: string, content: string) => {
    setTitle(title);
    setContent(content);
    setContentMode('manual');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Add New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Knowledge Base Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="Enter the title of your entry" 
              required 
              value={formData.title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              required
              value={formData.category}
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[200px]">
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Content Type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={contentMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setContentMode('manual')}
                className="flex-1"
              >
                <PenLine className="h-4 w-4 mr-2" />
                Write Manually
              </Button>
              <Button
                type="button"
                variant={contentMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setContentMode('upload')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              <Button
                type="button"
                variant={contentMode === 'ai' ? 'default' : 'outline'}
                onClick={() => setContentMode('ai')}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          </div>
          
          {contentMode === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the content of your knowledge base entry"
                className="min-h-[180px] max-h-[240px] resize-none"
                required={contentMode === 'manual'}
                value={formData.content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          )}
          
          {contentMode === 'upload' && (
            <div className="max-h-[240px] overflow-y-auto">
              <FileUpload
                onFileSelect={setSelectedFile}
                selectedFile={formData.selectedFile}
              />
            </div>
          )}

          {contentMode === 'ai' && (
            <div className="max-h-[240px] overflow-y-auto">
              <AIGenerator 
                onGeneratedContent={handleGeneratedContent}
                category={formData.category}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || contentMode === 'ai'}>
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
