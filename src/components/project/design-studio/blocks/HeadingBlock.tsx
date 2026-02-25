import { ContentBlock, DesignSettings } from '../types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeadingBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function HeadingBlock({ block, settings, onUpdate, preview }: HeadingBlockProps) {
  const { text, level } = block.content as { text?: string; level?: number };
  const lvl = level || 2;

  if (preview) {
    const Tag = `h${lvl}` as keyof JSX.IntrinsicElements;
    const sizes: Record<number, string> = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl' };
    return (
      <Tag
        className={`${sizes[lvl] || 'text-xl'} font-bold`}
        style={{ fontFamily: settings.headerFont, color: settings.primaryColor, borderBottom: `2px solid ${settings.primaryColor}20`, paddingBottom: '0.5rem' }}
      >
        {text || 'Section Heading'}
      </Tag>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <Select value={String(lvl)} onValueChange={(v) => onUpdate({ ...block, content: { ...block.content, level: Number(v) } })}>
        <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="1">H1</SelectItem>
          <SelectItem value="2">H2</SelectItem>
          <SelectItem value="3">H3</SelectItem>
        </SelectContent>
      </Select>
      <Input
        className="flex-1"
        placeholder="Section heading"
        value={String(text || '')}
        onChange={(e) => onUpdate({ ...block, content: { ...block.content, text: e.target.value } })}
      />
    </div>
  );
}
