import { ContentBlock, DesignSettings } from '../types';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        className="my-6 pl-6 py-2"
        style={{
          borderLeft: `3px solid ${settings.secondaryColor}`,
          fontFamily: settings.headerFont,
          color: '#2a2a2a',
          fontSize: '1.15rem',
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          p: ({ children }) => <p className="my-1">{children}</p>,
        }}>
          {text || 'Quote text'}
        </ReactMarkdown>
      </blockquote>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="w-1 rounded bg-primary" />
      <Textarea
        placeholder="Enter quote or highlight text (supports Markdown)..."
        value={text}
        onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
        className="min-h-[60px] text-sm italic"
      />
    </div>
  );
}
