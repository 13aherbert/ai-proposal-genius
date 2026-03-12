import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FieldMapping {
  id: string;
  source_field: string;
  target_field: string;
  transform_type: string;
  is_active: boolean;
}

const OPTIRFP_FIELDS = [
  { value: 'title', label: 'Project Title' },
  { value: 'client_name', label: 'Client Name' },
  { value: 'business_name', label: 'Business Name' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'status', label: 'Status' },
  { value: 'created_at', label: 'Created Date' },
];

const HUBSPOT_DEAL_FIELDS = [
  { value: 'dealname', label: 'Deal Name' },
  { value: 'company', label: 'Company' },
  { value: 'closedate', label: 'Close Date' },
  { value: 'dealstage', label: 'Deal Stage' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'pipeline', label: 'Pipeline' },
];

const TRANSFORM_TYPES = [
  { value: 'direct', label: 'Direct Copy' },
  { value: 'date', label: 'Date Format' },
  { value: 'map_status', label: 'Map Status' },
];

interface Props {
  integrationId: string;
}

export function FieldMappingEditor({ integrationId }: Props) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMappings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('integration_field_mappings')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at');

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Failed to load field mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    setMappings(prev => [...prev, {
      id: `new-${Date.now()}`,
      source_field: '',
      target_field: '',
      transform_type: 'direct',
      is_active: true,
    }]);
  };

  const handleRemoveMapping = async (id: string) => {
    if (id.startsWith('new-')) {
      setMappings(prev => prev.filter(m => m.id !== id));
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('integration_field_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMappings(prev => prev.filter(m => m.id !== id));
      toast.success('Mapping removed');
    } catch (error) {
      toast.error('Failed to remove mapping');
    }
  };

  const handleUpdateMapping = (id: string, field: keyof FieldMapping, value: any) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const mapping of mappings) {
        if (!mapping.source_field || !mapping.target_field) continue;

        if (mapping.id.startsWith('new-')) {
          const { error } = await (supabase as any)
            .from('integration_field_mappings')
            .insert({
              integration_id: integrationId,
              source_field: mapping.source_field,
              target_field: mapping.target_field,
              transform_type: mapping.transform_type,
              is_active: mapping.is_active,
            });
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from('integration_field_mappings')
            .update({
              source_field: mapping.source_field,
              target_field: mapping.target_field,
              transform_type: mapping.transform_type,
              is_active: mapping.is_active,
            })
            .eq('id', mapping.id);
          if (error) throw error;
        }
      }

      toast.success('Field mappings saved');
      await loadMappings();
    } catch (error) {
      console.error('Failed to save mappings:', error);
      toast.error('Failed to save field mappings');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, [integrationId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Field Mappings</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddMapping}>
              <Plus className="h-4 w-4 mr-1" /> Add Mapping
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 text-sm font-medium text-muted-foreground pb-2 border-b">
            <span>OptiRFP Field</span>
            <span>HubSpot Field</span>
            <span>Transform</span>
            <span>Active</span>
            <span></span>
          </div>
          {mappings.map(mapping => (
            <div key={mapping.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-center">
              <Select value={mapping.source_field} onValueChange={v => handleUpdateMapping(mapping.id, 'source_field', v)}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {OPTIRFP_FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mapping.target_field} onValueChange={v => handleUpdateMapping(mapping.id, 'target_field', v)}>
                <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {HUBSPOT_DEAL_FIELDS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mapping.transform_type} onValueChange={v => handleUpdateMapping(mapping.id, 'transform_type', v)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSFORM_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                checked={mapping.is_active}
                onCheckedChange={v => handleUpdateMapping(mapping.id, 'is_active', v)}
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveMapping(mapping.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {mappings.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No field mappings configured. Click "Add Mapping" to create one.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
