import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AddEntryDialogProps } from "./entry-dialog/types";
import { FileUpload } from "./entry-dialog/FileUpload";
import { useEntryForm } from "./entry-dialog/useEntryForm";

export const AddEntryDialog = ({ categories, open, onOpenChange }: AddEntryDialogProps) => {
  const { session } = useAuth();
  const {
    formData,
    setTitle,
    setCategory,
    setContent,
    setSelectedFile,
    uploadMode,
    setUploadMode,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Add New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
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
              <SelectContent>
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
            <div className="flex gap-4">
              <Button
                type="button"
                variant={uploadMode === 'text' ? 'default' : 'outline'}
                onClick={() => setUploadMode('text')}
              >
                Text
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
              >
                Upload Document
              </Button>
            </div>
          </div>
          {uploadMode === 'text' ? (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the content of your knowledge base entry"
                className="min-h-[200px]"
                required={uploadMode === 'text'}
                value={formData.content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          ) : (
            <FileUpload
              onFileSelect={setSelectedFile}
              selectedFile={formData.file}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};