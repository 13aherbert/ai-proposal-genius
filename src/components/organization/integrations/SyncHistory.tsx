import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SyncLog {
  id: string;
  sync_type: string;
  direction: string;
  records_processed: number;
  records_failed: number;
  error_details: any;
  started_at: string;
  completed_at: string | null;
}

interface Props {
  integrationId: string;
}

export function SyncHistory({ integrationId }: Props) {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('integration_sync_logs')
          .select('*')
          .eq('integration_id', integrationId)
          .order('started_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Failed to load sync logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
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
        <CardTitle className="text-lg">Sync History</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sync history yet. Trigger a sync to see results here.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {log.direction === 'push' ? (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{log.sync_type} {log.direction}</span>
                      {log.completed_at ? (
                        log.records_failed === 0 ? (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" /> Partial
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Running
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                      {log.records_processed > 0 && ` • ${log.records_processed} processed`}
                      {log.records_failed > 0 && ` • ${log.records_failed} failed`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
