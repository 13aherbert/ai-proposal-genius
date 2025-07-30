import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Image, 
  FileImage,
  AlertCircle,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface AssetUploaderProps {
  onAssetUploaded: (url: string, type: 'logo' | 'favicon') => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export function AssetUploader({ 
  onAssetUploaded, 
  acceptedFileTypes = ['image/*'],
  maxFileSize = 5 * 1024 * 1024 // 5MB
}: AssetUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { organization } = useCurrentOrganization();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!organization) {
      toast.error('No organization selected');
      return;
    }

    setUploading(true);
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const fileIndex = uploadedFiles.length + i;
      
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${organization.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('organization-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('organization-assets')
          .getPublicUrl(fileName);

        // Update file status
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, status: 'success' as const, progress: 100, url: publicUrl }
            : f
        ));

        // Determine asset type based on file name or size
        const assetType = file.name.toLowerCase().includes('favicon') || file.size < 100000 ? 'favicon' : 'logo';
        onAssetUploaded(publicUrl, assetType);

        toast.success(`${assetType === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`);

      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex 
            ? { ...f, status: 'error' as const, error: error.message }
            : f
        ));
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
  }, [organization, onAssetUploaded, toast, uploadedFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes
    },
    maxSize: maxFileSize,
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 animate-spin" />;
      case 'success': return <Check className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Asset Uploader
        </CardTitle>
        <CardDescription>
          Upload logos, favicons, and other branding assets. Supports images up to 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-primary">Drop the files here...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Drag & drop assets here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, SVG up to 5MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Uploaded Assets</Label>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="relative">
                  <img 
                    src={file.preview} 
                    alt={file.file.name}
                    className="h-12 w-12 object-cover rounded border"
                  />
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                <Badge variant="secondary" className={getStatusColor(file.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(file.status)}
                    <span className="capitalize">{file.status}</span>
                  </div>
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Upload Buttons */}
        <div className="flex gap-2">
          <Label htmlFor="logo-upload">
            <Button variant="outline" size="sm" asChild className="cursor-pointer">
              <span>
                <Image className="h-4 w-4 mr-2" />
                Upload Logo
              </span>
            </Button>
          </Label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) onDrop(files);
            }}
            className="hidden"
          />

          <Label htmlFor="favicon-upload">
            <Button variant="outline" size="sm" asChild className="cursor-pointer">
              <span>
                <FileImage className="h-4 w-4 mr-2" />
                Upload Favicon
              </span>
            </Button>
          </Label>
          <input
            id="favicon-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) onDrop(files);
            }}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}