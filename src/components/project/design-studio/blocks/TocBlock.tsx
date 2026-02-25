import { ContentBlock, DesignSettings } from '../types';

interface TocBlockProps {
  block: ContentBlock;
  allBlocks: ContentBlock[];
  settings: DesignSettings;
  preview?: boolean;
}

export function TocBlock({ allBlocks, settings, preview }: TocBlockProps) {
  const headings = allBlocks
    .filter((b) => b.type === 'heading')
    .map((b) => ({
      text: (b.content as { text?: string }).text || 'Untitled Section',
      level: (b.content as { level?: number }).level || 2,
    }));

  if (preview) {
    return (
      <div className="my-6 p-6 bg-muted/30 rounded-lg">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: settings.headerFont, color: settings.primaryColor }}>
          Table of Contents
        </h2>
        <ul className="space-y-2" style={{ fontFamily: settings.bodyFont }}>
          {headings.map((h, i) => (
            <li key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(h.level - 1) * 16}px` }}>
              <span className="text-sm font-medium" style={{ color: settings.primaryColor }}>{i + 1}.</span>
              <span className="text-sm">{h.text}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-3 border rounded-lg bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Table of Contents (auto-generated)</p>
      <ul className="space-y-1">
        {headings.length === 0 ? (
          <li className="text-xs text-muted-foreground italic">Add heading blocks to populate the table of contents</li>
        ) : (
          headings.map((h, i) => (
            <li key={i} className="text-xs" style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
              {i + 1}. {h.text}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
