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
    const headingStyle = (level: string) => ({
      color: settings.primaryColor,
      fontFamily: settings.headerFont,
    });

    return (
      <div className="prose prose-sm max-w-none" style={{ fontFamily: settings.bodyFont }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold mt-6 mb-4" style={headingStyle('h1')}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold mt-6 mb-3" style={headingStyle('h2')}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-bold mt-6 mb-2" style={headingStyle('h3')}>{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-semibold mt-4 mb-2" style={headingStyle('h4')}>{children}</h4>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse text-sm" style={{ fontFamily: settings.bodyFont }}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead>{children}</thead>
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
