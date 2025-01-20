import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KnowledgeCategory } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface AddEntryDialogProps {
  categories: KnowledgeCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddEntryDialog = ({ categories, open, onOpenChange }: AddEntryDialogProps) => {
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("You must be logged in to add entries");
      return;
    }

    if (uploadMode === 'file' && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsSubmitting(true);
      let filePath = null;

      if (uploadMode === 'file' && selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('knowledge-files')
          .upload(`files/${fileName}`, selectedFile);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        filePath = data.path;
      }

      // Insert entry into database
      const { error: insertError } = await supabase
        .from('knowledge_entries')
        .insert({
          title,
          category,
          content: uploadMode === 'text' ? content : null,
          file_path: filePath,
          user_id: session.user.id
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast.success("Entry added successfully!");
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setCategory("");
      setContent("");
      setSelectedFile(null);
      setUploadMode('text');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
    }
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="Enter the title of your entry" 
              required 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              required
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name.toLowerCase().replace(/\s+/g, '-')}>
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                  required={uploadMode === 'file'}
                />
                <label
                  htmlFor="file"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, TXT (max 20MB)
                  </span>
                </label>
              </div>
            </div>
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