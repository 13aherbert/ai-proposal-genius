import { ContentBlock } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageIcon, Upload, RefreshCw, X } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface ImageBlockProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
  organizationId?: string;
}

export function ImageBlock({ block, onUpdate, preview, organizationId }: ImageBlockProps) {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { url, caption } = block.content as { url?: string; caption?: string };

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user || !organizationId) return;

    const ext = file.name.split('.').pop();
    const path = `${organizationId}/design-assets/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('rfp-files').upload(path, file);
    if (error) {
      toast.error('Upload failed');
      return;
    }

    const { data: urlData } = supabase.storage.from('rfp-files').getPublicUrl(path);
    onUpdate({ ...block, content: { ...block.content, url: urlData.publicUrl } });
  }, [block, onUpdate, organizationId, session]);

  if (preview) {
    return (
      <figure className="my-4">
        {url ? (
          <img src={url} alt={String(caption || '')} className="max-w-full rounded-lg mx-auto" />
        ) : (
          <div className="bg-muted flex items-center justify-center h-48 rounded-lg">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
      {url ? (
        <div className="space-y-2">
          <img src={url} alt="" className="max-h-32 rounded mx-auto" />
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
              <RefreshCw className="h-3 w-3" /> Replace
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive" onClick={() => onUpdate({ ...block, content: { ...block.content, url: '' } })}>
              <X className="h-3 w-3" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Click to upload image</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <Input
        placeholder="Caption (optional)"
        value={String(caption || '')}
        onChange={(e) => onUpdate({ ...block, content: { ...block.content, caption: e.target.value } })}
        className="h-8 text-xs"
      />
    </div>
  );
}
