import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface QuickUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function QuickUploadZone({ onFileSelect, disabled = false }: QuickUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled) {
      onFileSelect(acceptedFiles[0]);
    }
    setIsDragActive(false);
  }, [onFileSelect, disabled]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "cursor-pointer transition-all duration-200 border-2 border-dashed",
        "hover:border-primary hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10 scale-[1.02]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={cn(
            "p-3 rounded-full transition-colors",
            "bg-gradient-to-r from-purple-600 to-blue-600"
          )}>
            {isDragActive ? (
              <FileText className="h-8 w-8 text-white" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              {isDragActive ? 'Drop your RFP here' : 'Upload New RFP'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to browse
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-purple-500" />
            <span>Auto-generates complete proposal</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">PDF</Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">DOC</Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">DOCX</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
