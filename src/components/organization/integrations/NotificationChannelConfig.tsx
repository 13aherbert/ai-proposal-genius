import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface NotificationEvent {
  key: string;
  label: string;
  description: string;
  category: 'project' | 'collaboration' | 'review' | 'export';
}

const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: 'project_created', label: 'Project Created', description: 'When a new proposal project is created', category: 'project' },
  { key: 'automation_complete', label: 'Automation Complete', description: 'When AI proposal generation finishes', category: 'project' },
  { key: 'section_assigned', label: 'Section Assigned', description: 'When a section is assigned to a team member (P1-1)', category: 'collaboration' },
  { key: 'comment_added', label: 'Comment / @Mention', description: 'When a comment is added or someone is @mentioned (P1-2)', category: 'collaboration' },
  { key: 'review_submitted', label: 'Review Submitted', description: 'When a section is submitted for review (P1-3)', category: 'review' },
  { key: 'review_approved', label: 'Review Approved', description: 'When a section review is approved (P1-3)', category: 'review' },
  { key: 'review_returned', label: 'Review Returned', description: 'When a section is returned with revisions (P1-3)', category: 'review' },
  { key: 'export_completed', label: 'Export Completed', description: 'When a document export finishes', category: 'export' },
];

interface ChannelConfig {
  [eventKey: string]: {
    enabled: boolean;
    channel: string;
  };
}

interface Props {
  integrationId: string;
  integrationType: string; // 'slack' | 'discord' | 'teams'
}

export function NotificationChannelConfig({ integrationId, integrationType }: Props) {
  const { organization } = useCurrentOrganization();
  const [config, setConfig] = useState<ChannelConfig>({});
  const [defaultChannel, setDefaultChannel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [integrationId]);

  const loadConfig = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('organization_integrations')
        .select('configuration')
        .eq('id', integrationId)
        .single();

      if (error) throw error;
      const cfg = data?.configuration || {};
      setDefaultChannel(cfg.default_channel || '');
      setConfig(cfg.notification_routing || {});
    } catch (error) {
      console.error('Failed to load notification config:', error);
    }
  };

  const handleToggleEvent = (eventKey: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      [eventKey]: { ...prev[eventKey], enabled, channel: prev[eventKey]?.channel || '' },
    }));
  };

  const handleChannelChange = (eventKey: string, channel: string) => {
    setConfig(prev => ({
      ...prev,
      [eventKey]: { ...prev[eventKey], channel, enabled: prev[eventKey]?.enabled ?? true },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: current } = await (supabase as any)
        .from('organization_integrations')
        .select('configuration')
        .eq('id', integrationId)
        .single();

      const updatedConfig = {
        ...(current?.configuration || {}),
        default_channel: defaultChannel,
        notification_routing: config,
      };

      const { error } = await (supabase as any)
        .from('organization_integrations')
        .update({ configuration: updatedConfig })
        .eq('id', integrationId);

      if (error) throw error;
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Failed to save notification config:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const channelPlaceholder = integrationType === 'slack' ? '#general' : integrationType === 'discord' ? '#notifications' : 'General';

  const groupedEvents = {
    project: NOTIFICATION_EVENTS.filter(e => e.category === 'project'),
    collaboration: NOTIFICATION_EVENTS.filter(e => e.category === 'collaboration'),
    review: NOTIFICATION_EVENTS.filter(e => e.category === 'review'),
    export: NOTIFICATION_EVENTS.filter(e => e.category === 'export'),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Notification Routing</CardTitle>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Default Channel</Label>
          <Input
            value={defaultChannel}
            onChange={e => setDefaultChannel(e.target.value)}
            placeholder={channelPlaceholder}
          />
          <p className="text-xs text-muted-foreground">
            Used when no specific channel is set for an event type.
          </p>
        </div>

        {Object.entries(groupedEvents).map(([category, events]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold capitalize text-muted-foreground">
              {category === 'collaboration' ? 'Collaboration (P1-1 / P1-2)' :
               category === 'review' ? 'Review Pipeline (P1-3)' :
               category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>
            {events.map(event => {
              const eventConfig = config[event.key] || { enabled: true, channel: '' };
              return (
                <div key={event.key} className="flex items-center gap-3 pl-2">
                  <Switch
                    checked={eventConfig.enabled ?? true}
                    onCheckedChange={v => handleToggleEvent(event.key, v)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{event.label}</span>
                    <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                  </div>
                  <Input
                    className="w-36 text-xs"
                    value={eventConfig.channel}
                    onChange={e => handleChannelChange(event.key, e.target.value)}
                    placeholder={defaultChannel || channelPlaceholder}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
