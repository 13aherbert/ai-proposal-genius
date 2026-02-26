import { templates } from './templates';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TemplateConfig } from './types';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

function TemplateMiniPreview({ template }: { template: TemplateConfig }) {
  const { primaryColor, secondaryColor } = template.defaults;
  const layout = template.coverLayout;

  return (
    <div className="w-full h-24 rounded border bg-white overflow-hidden" style={{ fontSize: 0 }}>
      {layout === 'split' ? (
        <div className="flex h-full">
          <div className="w-1/2 p-2 flex flex-col justify-center" style={{ backgroundColor: primaryColor }}>
            <div className="h-1.5 w-10 rounded-full bg-white/90 mb-1" />
            <div className="h-1 w-7 rounded-full bg-white/50" />
          </div>
          <div className="w-1/2 p-2 flex flex-col justify-center" style={{ backgroundColor: secondaryColor }}>
            <div className="h-1 w-8 rounded-full bg-white/60 mb-1" />
            <div className="h-1 w-6 rounded-full bg-white/40" />
          </div>
        </div>
      ) : layout === 'minimal' ? (
        <div className="h-full flex flex-col items-center justify-center p-3 border-2" style={{ borderColor: primaryColor }}>
          <div className="h-1.5 w-12 rounded-full mb-1.5" style={{ backgroundColor: primaryColor }} />
          <div className="h-0.5 w-6 mb-1.5" style={{ backgroundColor: primaryColor }} />
          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: secondaryColor, opacity: 0.5 }} />
        </div>
      ) : layout === 'full-bleed' ? (
        <div className="h-full flex flex-col items-center justify-end p-3" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
          <div className="h-2 w-14 rounded-full bg-white/90 mb-1" />
          <div className="h-1 w-8 rounded-full bg-white/50" />
        </div>
      ) : layout === 'left-aligned' ? (
        <div className="h-full flex flex-col justify-center p-3" style={{ backgroundColor: primaryColor }}>
          <div className="h-1.5 w-12 rounded-full bg-white/90 mb-1" />
          <div className="h-1 w-9 rounded-full bg-white/60 mb-1" />
          <div className="h-1 w-5 rounded-full bg-white/40" />
        </div>
      ) : layout === 'banner' ? (
        <div className="h-full flex flex-col">
          <div className="flex-1" style={{ background: `linear-gradient(135deg, ${primaryColor}88, ${secondaryColor}88)` }} />
          <div className="p-2" style={{ backgroundColor: primaryColor }}>
            <div className="h-1.5 w-10 rounded-full bg-white/90 mb-1" />
            <div className="h-1 w-7 rounded-full bg-white/50" />
          </div>
        </div>
      ) : layout === 'sidebar' ? (
        <div className="h-full flex">
          <div className="w-[30%] p-1.5 flex flex-col justify-end" style={{ backgroundColor: primaryColor }}>
            <div className="h-1 w-5 rounded-full bg-white/60 mb-0.5" />
            <div className="h-1 w-4 rounded-full bg-white/40" />
          </div>
          <div className="w-[70%] p-2 flex flex-col justify-center bg-white">
            <div className="h-1.5 w-12 rounded-full mb-1" style={{ backgroundColor: primaryColor }} />
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: secondaryColor, opacity: 0.5 }} />
          </div>
        </div>
      ) : layout === 'diagonal' ? (
        <div className="h-full relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundColor: primaryColor }} />
          <div className="absolute inset-0" style={{ backgroundColor: secondaryColor, clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }} />
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-2 w-12 rounded-full bg-white/90 mb-1" />
            <div className="h-1 w-7 rounded-full bg-white/60" />
          </div>
        </div>
      ) : (
        /* centered */
        <div className="h-full flex flex-col items-center justify-center p-3" style={{ backgroundColor: primaryColor }}>
          <div className="h-1.5 w-12 rounded-full bg-white/90 mb-1" />
          <div className="h-1 w-8 rounded-full bg-white/60 mb-1" />
          <div className="h-1 w-5 rounded-full bg-white/40" />
        </div>
      )}
    </div>
  );
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {templates.map((t) => (
        <Card
          key={t.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md border-2',
            selectedId === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
          )}
          onClick={() => onSelect(t.id)}
        >
          <CardContent className="p-3 space-y-2">
            <TemplateMiniPreview template={t} />
            <p className="text-sm font-medium text-center">{t.name}</p>
            <p className="text-xs text-muted-foreground text-center line-clamp-2">{t.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
