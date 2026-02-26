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
  info: { icon: Info, bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  warning: { icon: AlertTriangle, bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  success: { icon: CheckCircle, bg: '#dcfce7', border: '#22c55e', text: '#166534' },
};

export function CalloutBlock({ block, settings, onUpdate, preview }: CalloutBlockProps) {
  const text = (block.content as { text?: string }).text || '';
  const variant = ((block.content as { variant?: string }).variant || 'info') as keyof typeof VARIANTS;
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;

  if (preview) {
    return (
      <div className="flex gap-3 p-4 rounded-lg my-4" style={{ backgroundColor: v.bg, borderLeft: `4px solid ${v.border}` }}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: v.text }} />
        <div className="text-sm prose prose-sm max-w-none" style={{ color: v.text, fontFamily: settings.bodyFont }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            p: ({ children }) => <p className="my-1">{children}</p>,
          }}>
            {text || 'Callout text'}
          </ReactMarkdown>
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
