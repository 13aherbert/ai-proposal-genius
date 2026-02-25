import { ContentBlock, DesignSettings } from '../types';
import { Textarea } from '@/components/ui/textarea';

interface QuoteBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function QuoteBlock({ block, settings, onUpdate, preview }: QuoteBlockProps) {
  const text = (block.content as { text?: string }).text || '';

  if (preview) {
    return (
      <blockquote
        className="border-l-4 pl-4 py-2 my-4 italic"
        style={{ borderColor: settings.primaryColor, fontFamily: settings.bodyFont, color: settings.secondaryColor }}
      >
        {text || 'Quote text'}
      </blockquote>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="w-1 rounded bg-primary" />
      <Textarea
        placeholder="Enter quote or highlight text..."
        value={text}
        onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
        className="min-h-[60px] text-sm italic"
      />
    </div>
  );
}
