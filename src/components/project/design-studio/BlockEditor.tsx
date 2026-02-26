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
import { GripVertical, Plus, Trash2, Type, Image, Table, Minus, Quote, AlertCircle, Heading } from 'lucide-react';
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

function SortableBlock({ block, blocks, settings, organizationId, onUpdate, onRemove }: {
  block: ContentBlock;
  blocks: ContentBlock[];
  settings: DesignSettings;
  organizationId?: string;
  onUpdate: (block: ContentBlock) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const renderBlock = () => {
    switch (block.type) {
      case 'cover': return <CoverBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'toc': return <TocBlock block={block} allBlocks={blocks} settings={settings} />;
      case 'heading': return <HeadingBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'text': return <TextBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'image': return <ImageBlock block={block} onUpdate={onUpdate} organizationId={organizationId} />;
      case 'table': return <TableBlock block={block} settings={settings} onUpdate={onUpdate} />;
      case 'divider': return <DividerBlock block={block} settings={settings} />;
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
        <button onClick={onRemove} className="p-1 hover:bg-destructive/10 rounded text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        {renderBlock()}
      </div>
    </div>
  );
}

export function BlockEditor({ blocks, settings, organizationId, onChange }: BlockEditorProps) {
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

  const addBlock = (type: BlockType) => {
    const defaultContent: Record<BlockType, Record<string, unknown>> = {
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

    onChange([...blocks, { id: uuidv4(), type, content: defaultContent[type] }]);
  };

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              blocks={blocks}
              settings={settings}
              organizationId={organizationId}
              onUpdate={updateBlock}
              onRemove={() => removeBlock(block.id)}
            />
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
