import { ContentBlock, DesignSettings } from '../types';
import { Input } from '@/components/ui/input';

interface CoverBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function CoverBlock({ block, settings, onUpdate, preview }: CoverBlockProps) {
  const { title, subtitle, date } = block.content as { title?: string; subtitle?: string; date?: string };

  const updateField = (field: string, value: string) => {
    onUpdate({ ...block, content: { ...block.content, [field]: value } });
  };

  if (preview) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 rounded-lg"
        style={{ backgroundColor: settings.primaryColor, color: '#fff' }}
      >
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: settings.headerFont }}>{title || 'Proposal Title'}</h1>
        <p className="text-xl opacity-90 mb-6" style={{ fontFamily: settings.bodyFont }}>{subtitle || 'Subtitle'}</p>
        <p className="text-sm opacity-70">{date}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Page</p>
      <Input placeholder="Proposal Title" value={String(title || '')} onChange={(e) => updateField('title', e.target.value)} />
      <Input placeholder="Subtitle / Client Name" value={String(subtitle || '')} onChange={(e) => updateField('subtitle', e.target.value)} />
      <Input placeholder="Date" value={String(date || '')} onChange={(e) => updateField('date', e.target.value)} />
    </div>
  );
}
