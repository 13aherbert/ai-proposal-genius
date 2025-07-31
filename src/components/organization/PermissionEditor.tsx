import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrganizationMember } from '@/hooks/useOrganizationMembers';

interface PermissionEditorProps {
  member: OrganizationMember;
  onPermissionsUpdate: (memberId: string, permissions: Record<string, string[]>) => Promise<void>;
}

interface PermissionGroup {
  key: string;
  label: string;
  description: string;
  actions: { key: string; label: string; description: string; }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'projects',
    label: 'Projects',
    description: 'Manage project creation, editing, and deletion',
    actions: [
      { key: 'create', label: 'Create', description: 'Create new projects' },
      { key: 'read', label: 'View', description: 'View project details' },
      { key: 'update', label: 'Edit', description: 'Edit project information' },
      { key: 'delete', label: 'Delete', description: 'Delete projects' },
      { key: 'share', label: 'Share', description: 'Share projects with others' }
    ]
  },
  {
    key: 'knowledge_base',
    label: 'Knowledge Base',
    description: 'Manage knowledge entries and documentation',
    actions: [
      { key: 'create', label: 'Create', description: 'Create knowledge entries' },
      { key: 'read', label: 'View', description: 'View knowledge entries' },
      { key: 'update', label: 'Edit', description: 'Edit knowledge entries' },
      { key: 'delete', label: 'Delete', description: 'Delete knowledge entries' }
    ]
  },
  {
    key: 'team_management',
    label: 'Team Management',
    description: 'Manage team members and access',
    actions: [
      { key: 'invite', label: 'Invite', description: 'Invite new members' },
      { key: 'remove', label: 'Remove', description: 'Remove team members' },
      { key: 'modify_roles', label: 'Change Roles', description: 'Modify member roles' },
      { key: 'view_activity', label: 'View Activity', description: 'View team activity logs' }
    ]
  },
  {
    key: 'billing',
    label: 'Billing & Subscriptions',
    description: 'Manage billing and subscription settings',
    actions: [
      { key: 'view', label: 'View', description: 'View billing information' },
      { key: 'manage', label: 'Manage', description: 'Manage subscriptions and payments' }
    ]
  },
  {
    key: 'settings',
    label: 'Organization Settings',
    description: 'Manage organization configuration',
    actions: [
      { key: 'view', label: 'View', description: 'View organization settings' },
      { key: 'manage', label: 'Manage', description: 'Modify organization settings' }
    ]
  },
  {
    key: 'analytics',
    label: 'Analytics & Reporting',
    description: 'Access analytics and generate reports',
    actions: [
      { key: 'view', label: 'View', description: 'View analytics dashboards' },
      { key: 'export', label: 'Export', description: 'Export reports and data' }
    ]
  },
  {
    key: 'api_access',
    label: 'API Management',
    description: 'Manage API keys and integrations',
    actions: [
      { key: 'view', label: 'View', description: 'View API configurations' },
      { key: 'create', label: 'Create', description: 'Create API keys' },
      { key: 'manage', label: 'Manage', description: 'Manage API settings' }
    ]
  },
  {
    key: 'branding',
    label: 'Branding & White Label',
    description: 'Manage organization branding and white label settings',
    actions: [
      { key: 'manage', label: 'Manage', description: 'Manage branding and white label features' }
    ]
  }
];

export function PermissionEditor({ member, onPermissionsUpdate }: PermissionEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string[]>>(
    member.permissions || {}
  );
  const { toast } = useToast();

  const hasPermission = (groupKey: string, actionKey: string) => {
    return permissions[groupKey]?.includes(actionKey) || false;
  };

  const togglePermission = (groupKey: string, actionKey: string) => {
    setPermissions(prev => {
      const groupPermissions = prev[groupKey] || [];
      const hasPermission = groupPermissions.includes(actionKey);
      
      if (hasPermission) {
        return {
          ...prev,
          [groupKey]: groupPermissions.filter(p => p !== actionKey)
        };
      } else {
        return {
          ...prev,
          [groupKey]: [...groupPermissions, actionKey]
        };
      }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onPermissionsUpdate(member.id, permissions);
      toast({
        title: 'Permissions updated',
        description: `Permissions have been updated for ${member.first_name} ${member.last_name}`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            Configure granular permissions for {member.first_name} {member.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.key} className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">{group.label}</h4>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {group.actions.map((action) => (
                  <div key={action.key} className="flex items-start space-x-2">
                    <Checkbox
                      id={`${group.key}-${action.key}`}
                      checked={hasPermission(group.key, action.key)}
                      onCheckedChange={() => togglePermission(group.key, action.key)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`${group.key}-${action.key}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {action.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {group.key !== PERMISSION_GROUPS[PERMISSION_GROUPS.length - 1].key && (
                <Separator />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}