import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Star, Plus } from 'lucide-react';
import { useBrandGuidelines, BrandGuidelineInput, designSettingsToGuidelineInput } from '@/hooks/useBrandGuidelines';
import { AVAILABLE_FONTS } from '@/components/project/design-studio/templates';

function GuidelineForm({ initial, onSubmit, submitLabel }: {
  initial?: Partial<BrandGuidelineInput>;
  onSubmit: (data: BrandGuidelineInput) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<BrandGuidelineInput>({
    name: initial?.name ?? '',
    is_default: initial?.is_default ?? false,
    logo_url: initial?.logo_url ?? null,
    primary_color: initial?.primary_color ?? '#3B82F6',
    secondary_color: initial?.secondary_color ?? '#1E40AF',
    header_font: initial?.header_font ?? 'Inter',
    body_font: initial?.body_font ?? 'Georgia',
    header_style: initial?.header_style ?? 'accent-bar',
    cover_layout: initial?.cover_layout ?? 'centered',
    margins: initial?.margins ?? 'normal',
    section_numbering: initial?.section_numbering ?? false,
  });

  const update = <K extends keyof BrandGuidelineInput>(key: K, val: BrandGuidelineInput[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Name</Label>
        <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Default Brand" className="h-8 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Primary Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.primary_color} onChange={e => update('primary_color', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
            <Input value={form.primary_color} onChange={e => update('primary_color', e.target.value)} className="h-8 text-xs font-mono" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Secondary Color</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.secondary_color} onChange={e => update('secondary_color', e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
            <Input value={form.secondary_color} onChange={e => update('secondary_color', e.target.value)} className="h-8 text-xs font-mono" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Header Font</Label>
          <Select value={form.header_font} onValueChange={v => update('header_font', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{AVAILABLE_FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Body Font</Label>
          <Select value={form.body_font} onValueChange={v => update('body_font', v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{AVAILABLE_FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Set as Default</Label>
        <Switch checked={form.is_default} onCheckedChange={v => update('is_default', v)} className="scale-90" />
      </div>

      <Button size="sm" className="w-full" disabled={!form.name.trim()} onClick={() => onSubmit(form)}>
        {submitLabel}
      </Button>
    </div>
  );
}

export function BrandGuidelinesCard() {
  const { guidelines, isLoading, saveGuideline, updateGuideline, deleteGuideline, isSaving } = useBrandGuidelines();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editGuideline = guidelines.find(g => g.id === editId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Brand Guidelines</CardTitle>
            <CardDescription className="text-sm">Save branding presets to apply across proposals.</CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1"><Plus className="h-3.5 w-3.5" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Brand Guideline</DialogTitle></DialogHeader>
              <GuidelineForm
                submitLabel="Save Guideline"
                onSubmit={async data => {
                  await saveGuideline(data);
                  setCreateOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : guidelines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brand guidelines yet. Create one to use across proposals.</p>
        ) : (
          <div className="space-y-2">
            {guidelines.map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full border" style={{ background: g.primary_color }} />
                    <div className="w-4 h-4 rounded-full border" style={{ background: g.secondary_color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {g.name}
                      {g.is_default && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{g.header_font} / {g.body_font}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog open={editId === g.id} onOpenChange={open => setEditId(open ? g.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Brand Guideline</DialogTitle></DialogHeader>
                      {editGuideline && (
                        <GuidelineForm
                          initial={editGuideline}
                          submitLabel="Update"
                          onSubmit={async data => {
                            await updateGuideline({ id: g.id, ...data });
                            setEditId(null);
                          }}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteGuideline(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
