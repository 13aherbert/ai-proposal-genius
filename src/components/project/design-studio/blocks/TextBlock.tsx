import { ContentBlock, DesignSettings } from '../types';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';

interface TextBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function TextBlock({ block, settings, onUpdate, preview }: TextBlockProps) {
  const text = (block.content as { text?: string }).text || '';

  if (preview) {
    return (
      <div className="prose prose-sm max-w-none" style={{ fontFamily: settings.bodyFont }}>
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <Textarea
      placeholder="Enter content (supports Markdown)..."
      value={text}
      onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
      className="min-h-[120px] text-sm"
    />
  );
}
