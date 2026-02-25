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

interface ProposalPreviewProps {
  blocks: ContentBlock[];
  settings: DesignSettings;
}

const MARGIN_PX = { narrow: 24, normal: 48, wide: 72 };

export function ProposalPreview({ blocks, settings }: ProposalPreviewProps) {
  const noop = () => {};

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'cover': return <CoverBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'toc': return <TocBlock block={block} allBlocks={blocks} settings={settings} preview />;
      case 'heading': return <HeadingBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'text': return <TextBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'image': return <ImageBlock block={block} onUpdate={noop} preview />;
      case 'table': return <TableBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'divider': return <DividerBlock block={block} settings={settings} preview />;
      case 'quote': return <QuoteBlock block={block} settings={settings} onUpdate={noop} preview />;
      case 'callout': return <CalloutBlock block={block} settings={settings} onUpdate={noop} preview />;
      default: return null;
    }
  };

  return (
    <div
      className="bg-white text-black shadow-lg rounded-lg mx-auto max-w-[816px] min-h-[1056px]"
      style={{ padding: `${MARGIN_PX[settings.margins]}px`, fontFamily: settings.bodyFont }}
    >
      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id}>{renderBlock(block)}</div>
        ))}
      </div>
    </div>
  );
}
