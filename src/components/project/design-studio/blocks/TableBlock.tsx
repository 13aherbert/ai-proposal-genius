import { ContentBlock, DesignSettings } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface TableBlockProps {
  block: ContentBlock;
  settings: DesignSettings;
  onUpdate: (block: ContentBlock) => void;
  preview?: boolean;
}

export function TableBlock({ block, settings, onUpdate, preview }: TableBlockProps) {
  const headers = ((block.content as any).headers as string[]) || ['Item', 'Description', 'Price'];
  const rows = ((block.content as any).rows as string[][]) || [['', '', '']];

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = rows.map((r, ri) => ri === rowIdx ? r.map((c, ci) => ci === colIdx ? value : c) : [...r]);
    onUpdate({ ...block, content: { ...block.content, rows: newRows } });
  };

  const updateHeader = (colIdx: number, value: string) => {
    const newHeaders = headers.map((h, i) => i === colIdx ? value : h);
    onUpdate({ ...block, content: { ...block.content, headers: newHeaders } });
  };

  const addRow = () => {
    onUpdate({ ...block, content: { ...block.content, rows: [...rows, headers.map(() => '')] } });
  };

  const removeRow = (idx: number) => {
    onUpdate({ ...block, content: { ...block.content, rows: rows.filter((_, i) => i !== idx) } });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(r => [...r, '']);
    onUpdate({ ...block, content: { ...block.content, headers: newHeaders, rows: newRows } });
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, i) => i !== colIdx);
    const newRows = rows.map(r => r.filter((_, i) => i !== colIdx));
    onUpdate({ ...block, content: { ...block.content, headers: newHeaders, rows: newRows } });
  };

  if (preview) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse text-sm" style={{ fontFamily: settings.bodyFont }}>
          <thead>
            <tr style={{ backgroundColor: settings.primaryColor, color: '#fff' }}>
              {headers.map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-muted/30' : ''}>
                {row.map((cell, ci) => <td key={ci} className="px-4 py-2 border-b">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-1">
                  <div className="flex items-center gap-0.5">
                    <Input value={h} onChange={(e) => updateHeader(i, e.target.value)} className="h-7 text-xs font-semibold" />
                    {headers.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeColumn(i)}>
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-1">
                    <Input value={cell} onChange={(e) => updateCell(ri, ci, e.target.value)} className="h-7 text-xs" />
                  </td>
                ))}
                <td className="p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRow(ri)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Add Row
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={addColumn}>
          <Plus className="h-3 w-3 mr-1" /> Add Column
        </Button>
      </div>
    </div>
  );
}
