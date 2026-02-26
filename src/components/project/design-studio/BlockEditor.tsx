import { useState } from 'react';
import { ContentBlock, DesignSettings, BlockType } from './types';
import { CoverBlock } from './blocks/CoverBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { TableBlock } from './blocks/TableBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { TocBlock } from './blocks/TocBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus, Trash2, Type, Image, Table, Minus, Quote, AlertCircle, Heading, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

interface BlockEditorProps {
  blocks: ContentBlock[];
  settings: DesignSettings;
  organizationId?: string;
  onChange: (blocks: ContentBlock[]) => void;
}

const ADD_BLOCK_OPTIONS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Heading', icon: <Heading className="h-4 w-4" /> },
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'table', label: 'Table', icon: <Table className="h-4 w-4" /> },
  { type: 'divider', label: 'Divider', icon: <Minus className="h-4 w-4" /> },
  { type: 'quote', label: 'Quote', icon: <Quote className="h-4 w-4" /> },
  { type: 'callout', label: 'Callout', icon: <AlertCircle className="h-4 w-4" /> },
];

const DEFAULT_CONTENT: Record<BlockType, Record<string, unknown>> = {
  cover: { title: 'Proposal', subtitle: '', date: new Date().toLocaleDateString() },
  toc: {},
  heading: { text: '', level: 2 },
  text: { text: '' },
  image: { url: '', caption: '' },
  table: { headers: ['Item', 'Description', 'Price'], rows: [['', '', '']] },
  divider: {},
  quote: { text: '' },
  callout: { text: '', variant: 'info' },
};

function getBlockSummary(block: ContentBlock): string {
  const c = block.content as Record<string, unknown>;
  switch (block.type) {
    case 'cover': return String(c.title || 'Cover Page');
    case 'heading': return `H${c.level || 2}: ${String(c.text || 'Heading')}`;
    case 'text': return String(c.text || '').slice(0, 60) || 'Empty text';
    case 'toc': return 'Table of Contents';
    case 'image': return String(c.caption || 'Image');
    case 'table': return `Table (${((c.headers as string[]) || []).length} cols)`;
    case 'divider': return (c.isPageBreak ? 'Page Break' : 'Divider');
    case 'quote': return String(c.text || '').slice(0, 60) || 'Quote';
    case 'callout': return String(c.text || '').slice(0, 60) || 'Callout';
    default: return block.type;
  }
}

function InsertBetweenButton({ onInsert }: { onInsert: (type: BlockType) => void }) {
  return (
    <div className="flex justify-center -my-1 opacity-0 hover:opacity-100 transition-opacity z-10 relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform">
            <Plus className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {ADD_BLOCK_OPTIONS.map((opt) => (
            <DropdownMenuItem key={opt.type} onClick={() => onInsert(opt.type)}>
              {opt.icon}
              <span className="ml-2">{opt.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SortableBlock({ block, blocks, settings, organizationId, onUpdate, onRemove, onDuplicate, isCollapsed, onToggleCollapse }: {
  block: ContentBlock;
  blocks: ContentBlock[];
  settings: DesignSettings;
  organizationId?: string;
  onUpdate: (block: ContentBlock) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const renderBlock = () => {
    switch (block.type) {
      case 'cover': return <CoverBlock block={block} settings={settings} onUpdate={onUpdate} organizationId={organizationId} />;
      case 'toc': return <TocBlock block={block} allBlocks={blocks} settings={settings} />;
      case 'heading': return <HeadingBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'text': return <TextBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'image': return <ImageBlock block={block} onUpdate={onUpdate} organizationId={organizationId} />;
      case 'table': return <TableBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'divider': return <DividerBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'quote': return <QuoteBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'callout': return <CalloutBlock block={block} settings={settings} onUpdate={onUpdate} />;
      default: return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} id={`block-${block.id}`} className="group flex gap-1 items-start">
      <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={onToggleCollapse} className="p-1 hover:bg-muted rounded text-muted-foreground">
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onDuplicate} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Duplicate block">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button onClick={onRemove} className="p-1 hover:bg-destructive/10 rounded text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        {isCollapsed ? (
          <div
            className="px-3 py-2 bg-muted/50 rounded border border-dashed cursor-pointer text-xs text-muted-foreground truncate"
            onClick={onToggleCollapse}
          >
            <span className="font-medium capitalize">{block.type}</span>
            <span className="mx-1.5">—</span>
            <span>{getBlockSummary(block)}</span>
          </div>
        ) : (
          renderBlock()
        )}
      </div>
    </div>
  );
}

export function BlockEditor({ blocks, settings, organizationId, onChange }: BlockEditorProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex(b => b.id === active.id);
    const newIdx = blocks.findIndex(b => b.id === over.id);
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIdx, 1);
    newBlocks.splice(newIdx, 0, moved);
    onChange(newBlocks);
  };

  const updateBlock = (updated: ContentBlock) => {
    onChange(blocks.map(b => b.id === updated.id ? updated : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const duplicateBlock = (block: ContentBlock) => {
    const idx = blocks.findIndex(b => b.id === block.id);
    const clone: ContentBlock = { ...block, id: uuidv4(), content: { ...block.content } };
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, clone);
    onChange(newBlocks);
  };

  const insertBlockAt = (index: number, type: BlockType) => {
    const newBlock: ContentBlock = { id: uuidv4(), type, content: { ...DEFAULT_CONTENT[type] } };
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, newBlock);
    onChange(newBlocks);
  };

  const addBlock = (type: BlockType) => {
    onChange([...blocks, { id: uuidv4(), type, content: { ...DEFAULT_CONTENT[type] } }]);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, idx) => (
            <div key={block.id}>
              {idx > 0 && (
                <InsertBetweenButton onInsert={(type) => insertBlockAt(idx, type)} />
              )}
              <SortableBlock
                block={block}
                blocks={blocks}
                settings={settings}
                organizationId={organizationId}
                onUpdate={updateBlock}
                onRemove={() => removeBlock(block.id)}
                onDuplicate={() => duplicateBlock(block)}
                isCollapsed={collapsedIds.has(block.id)}
                onToggleCollapse={() => toggleCollapse(block.id)}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-1" /> Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {ADD_BLOCK_OPTIONS.map((opt) => (
            <DropdownMenuItem key={opt.type} onClick={() => addBlock(opt.type)}>
              {opt.icon}
              <span className="ml-2">{opt.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
