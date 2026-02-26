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

export function ProposalOutlineSidebar({ blocks, onScrollTo }: ProposalOutlineSidebarProps) {
  return (
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
  );
}
