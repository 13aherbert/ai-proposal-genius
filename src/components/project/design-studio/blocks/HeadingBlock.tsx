import { ContentBlock, DesignSettings, HeaderStyle } from '../types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeadingBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
  sectionNumber?: string;
}

export function HeadingBlock({ block, settings, onUpdate, preview, sectionNumber }: HeadingBlockProps) {
  const { text, level } = block.content as { text?: string; level?: number };
  const lvl = level || 2;
  const style: HeaderStyle = settings.headerStyle || 'accent-bar';
  const prefix = settings.sectionNumbering && sectionNumber ? `${sectionNumber} ` : '';

  if (preview) {
    const Tag = `h${lvl}` as keyof JSX.IntrinsicElements;
    const sizes: Record<number, string> = { 1: 'text-3xl', 2: 'text-2xl', 3: 'text-xl' };
    const baseClass = `${sizes[lvl] || 'text-xl'}`;

    const getStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = { fontFamily: settings.headerFont, color: settings.primaryColor };
      switch (style) {
        case 'bold': return { ...base, fontWeight: 800 };
        case 'underline': return { ...base, fontWeight: 700, borderBottom: `3px solid ${settings.primaryColor}`, paddingBottom: '0.5rem' };
        case 'accent-bar': return { ...base, fontWeight: 700, borderLeft: `4px solid ${settings.primaryColor}`, paddingLeft: '0.75rem' };
        case 'gradient': return { ...base, fontWeight: 700, backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
        case 'boxed': return { fontFamily: settings.headerFont, fontWeight: 700, backgroundColor: settings.primaryColor, color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.25rem' };
        case 'pill': return { fontFamily: settings.headerFont, fontWeight: 700, backgroundColor: settings.primaryColor, color: '#fff', padding: '0.4rem 1.5rem', borderRadius: '9999px', display: 'inline-block' };
        case 'numbered': return { ...base, fontWeight: 700, borderBottom: `2px solid ${settings.primaryColor}`, paddingBottom: '0.5rem' };
        case 'minimal': default: return { ...base, fontWeight: 600 };
      }
    };

    if (style === 'numbered' && prefix) {
      return (
        <div className="flex items-center gap-3" style={{ borderBottom: `2px solid ${settings.primaryColor}`, paddingBottom: '0.5rem' }}>
          <span
            className="flex-shrink-0 flex items-center justify-center rounded text-white font-bold"
            style={{ backgroundColor: settings.primaryColor, width: '2rem', height: '2rem', fontSize: '0.875rem' }}
          >
            {prefix.trim()}
          </span>
          <Tag className={baseClass} style={{ fontFamily: settings.headerFont, color: settings.primaryColor, fontWeight: 700 }}>
            {text || 'Section Heading'}
          </Tag>
        </div>
      );
    }

    return (
      <Tag className={baseClass} style={getStyle()}>
        {prefix}{text || 'Section Heading'}
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
