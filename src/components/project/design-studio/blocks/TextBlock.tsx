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
    const headingFont = settings.headerFont;
    const bodyFont = settings.bodyFont;
    const primary = settings.primaryColor;
    const secondary = settings.secondaryColor;

    return (
      <div
        className="max-w-[70ch]"
        style={{
          fontFamily: bodyFont,
          color: '#2a2a2a',
          fontSize: '15px',
          lineHeight: 1.75,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mt-8 mb-4" style={{ fontFamily: headingFont, color: primary, fontSize: '2.25rem', lineHeight: 1.15, fontWeight: 700, letterSpacing: '-0.015em' }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-7 mb-3" style={{ fontFamily: headingFont, color: primary, fontSize: '1.65rem', lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em' }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-2" style={{ fontFamily: headingFont, color: primary, fontSize: '1.25rem', lineHeight: 1.3, fontWeight: 600 }}>{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="mt-5 mb-2" style={{ fontFamily: headingFont, color: primary, fontSize: '1.05rem', lineHeight: 1.35, fontWeight: 600 }}>{children}</h4>
            ),
            p: ({ children }) => (
              <p className="my-3" style={{ marginBottom: '1rem' }}>{children}</p>
            ),
            ul: ({ children }) => <ul className="my-3 pl-5 list-disc space-y-1.5">{children}</ul>,
            ol: ({ children }) => <ol className="my-3 pl-5 list-decimal space-y-1.5">{children}</ol>,
            li: ({ children }) => <li style={{ lineHeight: 1.7 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: primary, fontWeight: 700 }}>{children}</strong>,
            blockquote: ({ children }) => (
              <blockquote
                className="my-5 pl-5 italic"
                style={{ borderLeft: `3px solid ${secondary}`, color: '#444', fontFamily: headingFont, fontSize: '1.05rem' }}
              >
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-5">
                <table className="w-full border-collapse text-[14px]" style={{ fontFamily: bodyFont }}>
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead>{children}</thead>,
            tr: ({ children }) => <tr>{children}</tr>,
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left font-semibold border-b-2" style={{ borderColor: primary, color: primary, fontFamily: headingFont }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {children}
              </td>
            ),
            hr: () => <hr className="my-6" style={{ border: 'none', borderTop: `1px solid ${secondary}`, opacity: 0.4 }} />,
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
