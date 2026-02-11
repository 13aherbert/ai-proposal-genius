import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Zap, 
  Check, 
  Loader2, 
  ExternalLink,
  X,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadStep } from '@/hooks/use-quick-upload';

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: UploadStep;
  progress: number;
  projectTitle: string;
  error: string | null;
  autoGenerate: boolean;
  setAutoGenerate: (value: boolean) => void;
  onUpload: (file: File, title?: string) => Promise<string | null>;
  onViewProject: () => void;
}

export function QuickUploadModal({
  isOpen,
  onClose,
  step,
  progress,
  projectTitle,
  error,
  autoGenerate,
  setAutoGenerate,
  onUpload,
  onViewProject,
}: QuickUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: step !== 'idle',
  });

  const handleUpload = useCallback(async () => {
    if (selectedFile) {
      await onUpload(selectedFile, customTitle || undefined);
    }
  }, [selectedFile, customTitle, onUpload]);

  const handleClose = useCallback(() => {
    if (step !== 'uploading' && step !== 'creating') {
      setSelectedFile(null);
      setCustomTitle('');
      onClose();
    }
  }, [step, onClose]);

  const isProcessing = step === 'uploading' || step === 'creating';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Quick Upload RFP
          </DialogTitle>
          <DialogDescription>
            Upload your RFP and we'll generate a complete proposal automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Drop Zone */}
          {step === 'idle' && !selectedFile && (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                "hover:border-primary hover:bg-primary/5",
                isDragActive && "border-primary bg-primary/10"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your RFP'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected File */}
          {selectedFile && step === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    setCustomTitle('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-title">Project Title</Label>
                <Input
                  id="project-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter project title"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Auto-generate proposal</span>
                </div>
                <Switch
                  checked={autoGenerate}
                  onCheckedChange={setAutoGenerate}
                />
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <p className="font-medium">
                    {step === 'uploading' ? 'Uploading file...' : 'Creating project...'}
                  </p>
                  <p className="text-sm text-muted-foreground">{projectTitle}</p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Complete State */}
          {step === 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="p-2 bg-green-500 rounded-full">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Upload Complete!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    {projectTitle}
                  </p>
                </div>
              </div>
              
              <Button onClick={onViewProject} className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                View Project
              </Button>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Upload Failed</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {step === 'idle' && selectedFile && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload & Start
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
            <Button 
              onClick={() => setSelectedFile(null)} 
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
