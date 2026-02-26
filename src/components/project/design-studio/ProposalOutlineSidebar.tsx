import { useMemo } from 'react';
import { ContentBlock, BlockType } from './types';
import { FileText, Heading, Type, Image, Table, Minus, Quote, AlertCircle, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalOutlineSidebarProps {
  blocks: ContentBlock[];
  onScrollTo: (blockId: string) => void;
}

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  cover: <FileText className="h-3.5 w-3.5" />,
  toc: <List className="h-3.5 w-3.5" />,
  heading: <Heading className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  image: <Image className="h-3.5 w-3.5" />,
  table: <Table className="h-3.5 w-3.5" />,
  divider: <Minus className="h-3.5 w-3.5" />,
  quote: <Quote className="h-3.5 w-3.5" />,
  callout: <AlertCircle className="h-3.5 w-3.5" />,
};

function getBlockLabel(block: ContentBlock): string {
  const c = block.content as Record<string, unknown>;
  switch (block.type) {
    case 'cover': return String(c.title || 'Cover Page');
    case 'heading': return String(c.text || 'Heading');
    case 'text': return String(c.text || 'Text').slice(0, 40) || 'Text';
    case 'toc': return 'Table of Contents';
    case 'image': return String(c.caption || 'Image');
    case 'table': return 'Table';
    case 'divider': return 'Divider';
    case 'quote': return String(c.text || 'Quote').slice(0, 40) || 'Quote';
    case 'callout': return String(c.text || 'Callout').slice(0, 40) || 'Callout';
    default: return block.type;
  }
}

function countWords(blocks: ContentBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    const c = block.content as Record<string, unknown>;
    const fields = ['text', 'title', 'subtitle'];
    for (const f of fields) {
      if (typeof c[f] === 'string') {
        total += (c[f] as string).split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return total;
}

export function ProposalOutlineSidebar({ blocks, onScrollTo }: ProposalOutlineSidebarProps) {
  const wordCount = useMemo(() => countWords(blocks), [blocks]);
  const pageEstimate = Math.max(1, Math.ceil(wordCount / 300));

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Outline</p>
        {blocks.map((block) => (
          <button
            key={block.id}
            onClick={() => onScrollTo(block.id)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted/70 transition-colors text-left',
              block.type === 'heading' && 'font-medium',
              block.type === 'cover' && 'font-semibold',
            )}
          >
            <span className="text-muted-foreground shrink-0">{BLOCK_ICONS[block.type]}</span>
            <span className="truncate">{getBlockLabel(block)}</span>
          </button>
        ))}
      </div>

      {/* Document stats */}
      <div className="border-t pt-3 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stats</p>
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Words</span>
          <span className="font-medium text-foreground">{wordCount.toLocaleString()}</span>
        </div>
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Est. pages</span>
          <span className="font-medium text-foreground">~{pageEstimate}</span>
        </div>
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Blocks</span>
          <span className="font-medium text-foreground">{blocks.length}</span>
        </div>
      </div>
    </div>
  );
}
