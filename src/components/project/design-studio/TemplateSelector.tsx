import { templates } from './templates';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {templates.map((t) => (
        <Card
          key={t.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-md border-2',
            selectedId === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
          )}
          onClick={() => onSelect(t.id)}
        >
          <CardContent className="p-3 text-center space-y-2">
            <div className="text-3xl">{t.preview}</div>
            <p className="text-sm font-medium">{t.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
