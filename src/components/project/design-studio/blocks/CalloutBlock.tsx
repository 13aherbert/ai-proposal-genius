import { ContentBlock, DesignSettings } from '../types';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CalloutBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

const VARIANTS = {
  info: { icon: Info, accent: 'hsl(214, 84%, 46%)' },
  warning: { icon: AlertTriangle, accent: 'hsl(36, 90%, 48%)' },
  success: { icon: CheckCircle, accent: 'hsl(142, 60%, 38%)' },
};

export function CalloutBlock({ block, settings, onUpdate, preview }: CalloutBlockProps) {
  const text = (block.content as { text?: string }).text || '';
  const variant = ((block.content as { variant?: string }).variant || 'info') as keyof typeof VARIANTS;
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;
  // Use template's secondary color (gold/accent) for the rule whenever the variant is "info"
  // so the callout reads as part of the design system, not a generic alert.
  const ruleColor = variant === 'info' ? settings.secondaryColor : v.accent;

  if (preview) {
    return (
      <div
        className="my-6 pl-5 py-3 pr-4"
        style={{ borderLeft: `3px solid ${ruleColor}`, backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-4 w-4 shrink-0 mt-1" style={{ color: ruleColor }} />
          <div
            className="prose prose-sm max-w-none"
            style={{ fontFamily: settings.bodyFont, color: '#2a2a2a', fontSize: '15px', lineHeight: 1.65 }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
            }}>
              {text || 'Callout text'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg" style={{ borderLeftWidth: 4, borderLeftColor: v.border }}>
      <div className="flex gap-2 items-center">
        <Select value={variant} onValueChange={(val) => onUpdate({ ...block, content: { ...block.content, variant: val } })}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="success">Success</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        placeholder="Callout text (supports Markdown)..."
        value={text}
        onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
        className="min-h-[50px] text-sm"
      />
    </div>
  );
}
