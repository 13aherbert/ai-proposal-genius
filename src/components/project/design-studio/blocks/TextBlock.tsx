import { ContentBlock, DesignSettings } from '../types';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse text-sm" style={{ fontFamily: settings.bodyFont }}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead>
                {children}
              </thead>
            ),
            tr: ({ children }) => (
              <tr>{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2 text-left font-semibold" style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 border-b border-border">
                {children}
              </td>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
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
