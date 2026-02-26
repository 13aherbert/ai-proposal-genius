import { ContentBlock, DesignSettings } from '../types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DividerBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate?: (block: ContentBlock) => void;
  preview?: boolean;
}

export function DividerBlock({ block, settings, onUpdate, preview }: DividerBlockProps) {
  const isPageBreak = (block.content as { isPageBreak?: boolean }).isPageBreak ?? true;

  if (preview) {
    return (
      <hr
        className="my-8"
        style={{
          borderColor: `${settings.primaryColor}30`,
          ...(isPageBreak ? { pageBreakAfter: 'always' as const } : {}),
        }}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <hr className="flex-1 border-dashed" />
      <div className="flex items-center gap-2">
        <Label className="text-[10px] text-muted-foreground cursor-pointer">
          {isPageBreak ? 'Page Break' : 'Decorative'}
        </Label>
        <Switch
          checked={isPageBreak}
          onCheckedChange={(checked) =>
            onUpdate?.({ ...block, content: { ...block.content, isPageBreak: checked } })
          }
          className="scale-75"
        />
      </div>
      <hr className="flex-1 border-dashed" />
    </div>
  );
}
