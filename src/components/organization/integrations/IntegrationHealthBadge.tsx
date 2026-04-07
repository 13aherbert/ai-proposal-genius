import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export type HealthStatus = 'connected' | 'issues' | 'disconnected' | 'syncing';

interface Props {
  status: HealthStatus;
  className?: string;
}

export function IntegrationHealthBadge({ status, className }: Props) {
  switch (status) {
    case 'connected':
      return (
        <Badge variant="outline" className={`border-green-500/40 text-green-600 bg-green-500/10 ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" /> Connected
        </Badge>
      );
    case 'issues':
      return (
        <Badge variant="outline" className={`border-amber-500/40 text-amber-600 bg-amber-500/10 ${className}`}>
          <AlertTriangle className="h-3 w-3 mr-1" /> Issues
        </Badge>
      );
    case 'disconnected':
      return (
        <Badge variant="outline" className={`border-destructive/40 text-destructive bg-destructive/10 ${className}`}>
          <XCircle className="h-3 w-3 mr-1" /> Disconnected
        </Badge>
      );
    case 'syncing':
      return (
        <Badge variant="outline" className={`border-blue-500/40 text-blue-600 bg-blue-500/10 ${className}`}>
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing
        </Badge>
      );
  }
}

export function deriveHealth(integration: {
  is_active: boolean;
  sync_status: string | null;
  error_message: string | null;
}): HealthStatus {
  if (!integration.is_active) return 'disconnected';
  if (integration.sync_status === 'syncing') return 'syncing';
  if (integration.sync_status === 'error' || integration.error_message) return 'issues';
  return 'connected';
}
