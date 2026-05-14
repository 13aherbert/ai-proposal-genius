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
  const rawText = (block.content as { text?: string }).text || '';
  const { level } = block.content as { level?: number };
  // Strip markdown bold/italic markers for display
  const text = rawText.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1').replace(/_{1,3}(.*?)_{1,3}/g, '$1');
  const lvl = level || 2;
  const style: HeaderStyle = settings.headerStyle || 'accent-bar';
  const prefix = settings.sectionNumbering && sectionNumber ? `${sectionNumber} ` : '';

  if (preview) {
    const Tag = `h${lvl}` as keyof JSX.IntrinsicElements;
    const sizes: Record<number, string> = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-xl' };
    const baseClass = `${sizes[lvl] || 'text-xl'} tracking-tight`;
    const primary = settings.primaryColor;
    const secondary = settings.secondaryColor;

    const baseStyle: React.CSSProperties = {
      fontFamily: settings.headerFont,
      color: primary,
      lineHeight: 1.15,
      letterSpacing: '-0.015em',
    };

    // Numbered with section number prefix gets its own pill+rule layout
    if (style === 'numbered' && prefix) {
      return (
        <div className="flex items-baseline gap-3 mt-8 mb-4 pb-3" style={{ borderBottom: `1px solid ${secondary}40` }}>
          <span
            className="flex-shrink-0 inline-flex items-center justify-center text-xs font-semibold tracking-widest"
            style={{ color: secondary, fontFamily: settings.bodyFont, minWidth: '2.5rem' }}
          >
            {prefix.trim()}
          </span>
          <Tag className={baseClass} style={{ ...baseStyle, fontWeight: 700 }}>
            {text || 'Section Heading'}
          </Tag>
        </div>
      );
    }

    const wrapperClass = 'mt-8 mb-4';

    switch (style) {
      case 'underline':
        return (
          <div className={wrapperClass}>
            <Tag className={baseClass} style={{ ...baseStyle, fontWeight: 700 }}>
              {text || 'Section Heading'}
            </Tag>
            <div className="mt-2 h-[2px] w-16" style={{ backgroundColor: secondary }} />
          </div>
        );
      case 'accent-bar':
        return (
          <div className={`${wrapperClass} flex items-stretch gap-3`}>
            <div className="w-1 rounded-full self-stretch" style={{ backgroundColor: secondary }} />
            <Tag className={baseClass} style={{ ...baseStyle, fontWeight: 700 }}>
              {text || 'Section Heading'}
            </Tag>
          </div>
        );
      case 'gradient':
        return (
          <Tag
            className={`${wrapperClass} ${baseClass}`}
            style={{
              ...baseStyle,
              fontWeight: 800,
              backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {text || 'Section Heading'}
          </Tag>
        );
      case 'boxed':
        return (
          <Tag
            className={`${wrapperClass} ${baseClass} inline-block px-4 py-2 rounded`}
            style={{ fontFamily: settings.headerFont, fontWeight: 700, backgroundColor: primary, color: '#fff' }}
          >
            {text || 'Section Heading'}
          </Tag>
        );
      case 'pill':
        return (
          <div className={wrapperClass}>
            <Tag
              className="inline-block text-base px-4 py-1.5 rounded-full"
              style={{ fontFamily: settings.headerFont, fontWeight: 700, backgroundColor: primary, color: '#fff', letterSpacing: '0.02em' }}
            >
              {text || 'Section Heading'}
            </Tag>
          </div>
        );
      case 'numbered':
        // numbered without section number prefix
        return (
          <div className={`${wrapperClass} pb-2`} style={{ borderBottom: `2px solid ${primary}` }}>
            <Tag className={baseClass} style={{ ...baseStyle, fontWeight: 700 }}>
              {text || 'Section Heading'}
            </Tag>
          </div>
        );
      case 'minimal':
        return (
          <div className={wrapperClass}>
            <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: secondary, fontFamily: settings.bodyFont }}>
              Section
            </div>
            <Tag className={baseClass} style={{ ...baseStyle, fontWeight: 500 }}>
              {text || 'Section Heading'}
            </Tag>
          </div>
        );
      case 'bold':
      default:
        return (
          <Tag className={`${wrapperClass} ${baseClass}`} style={{ ...baseStyle, fontWeight: 800 }}>
            {text || 'Section Heading'}
          </Tag>
        );
    }
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
