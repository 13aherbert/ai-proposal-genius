import { ContentBlock, DesignSettings } from '../types';

interface DividerBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  preview?: boolean;
}

export function DividerBlock({ settings, preview }: DividerBlockProps) {
  if (preview) {
    return <hr className="my-8" style={{ borderColor: `${settings.primaryColor}30` }} />;
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <hr className="flex-1 border-dashed" />
      <span className="text-[10px] text-muted-foreground uppercase">Divider / Page Break</span>
      <hr className="flex-1 border-dashed" />
    </div>
  );
}
