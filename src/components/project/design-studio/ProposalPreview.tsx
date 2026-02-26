import { useState, useMemo } from 'react';
import { ContentBlock, DesignSettings } from './types';
import { CoverBlock } from './blocks/CoverBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { TableBlock } from './blocks/TableBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { TocBlock } from './blocks/TocBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { Slider } from '@/components/ui/slider';
import { ZoomIn } from 'lucide-react';
import { computeSectionNumbers } from './sectionNumbers';

interface ProposalPreviewProps {
  blocks: ContentBlock[];
  settings: DesignSettings;
}

const MARGIN_PX = { narrow: 24, normal: 48, wide: 72 };

export function ProposalPreview({ blocks, settings }: ProposalPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const noop = () => {};

  const sectionMap = useMemo(
    () => (settings.sectionNumbering ? computeSectionNumbers(blocks) : {}),
    [blocks, settings.sectionNumbering]
  );

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'cover': return <CoverBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'toc': return <TocBlock block={block} allBlocks={blocks} settings={settings} preview />;
      case 'heading': return <HeadingBlock block={block} settings={settings} onUpdate={noop} preview sectionNumber={sectionMap[block.id]} />;
      case 'text': return <TextBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'image': return <ImageBlock block={block} onUpdate={noop} preview />;
      case 'table': return <TableBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'divider': return <DividerBlock block={block} settings={settings} preview />;
      case 'quote': return <QuoteBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'callout': return <CalloutBlock block={block} settings={settings} onUpdate={noop} preview />;
      default: return null;
    }
  };

  const isPageBreak = (block: ContentBlock) =>
    block.type === 'divider' && ((block.content as { isPageBreak?: boolean }).isPageBreak ?? true);

  return (
    <div className="space-y-3">
      {/* Zoom control */}
      <div className="flex items-center gap-2 px-1">
        <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
        <Slider
          value={[zoom]}
          onValueChange={([v]) => setZoom(v)}
          min={50}
          max={150}
          step={10}
          className="w-32"
        />
        <span className="text-[10px] text-muted-foreground w-8">{zoom}%</span>
      </div>

      <div
        className="bg-white text-black shadow-lg rounded-lg mx-auto max-w-[816px] min-h-[1056px] origin-top"
        style={{
          padding: `${MARGIN_PX[settings.margins]}px`,
          fontFamily: settings.bodyFont,
          transform: `scale(${zoom / 100})`,
        }}
      >
        <div className="space-y-6">
          {blocks.map((block, idx) => (
            <div key={block.id}>
              <div>{renderBlock(block)}</div>
              {isPageBreak(block) && idx < blocks.length - 1 && (
                <div className="border-t-2 border-dashed border-muted-foreground/30 my-6 relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] text-muted-foreground uppercase tracking-wider">
                    Page Break
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
