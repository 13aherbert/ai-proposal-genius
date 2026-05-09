import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { TeamManagement } from '@/components/organization/TeamManagement';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/use-seo';

export default function Team() {
  useSEO({ title: "Team — OptiRFP", description: "Manage members, roles, and invitations for your OptiRFP organization." });
  const { organization } = useCurrentOrganization();
  const { members } = useOrganizationMembers(organization?.id);

  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Team Management {organization?.name ? `— ${organization.name}` : ''}
        </h1>
        <p className="text-muted-foreground">Manage your team members, roles, and permissions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{members.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-accent/10 p-3">
              <UserCheck className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold">{activeMembers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <TeamManagement />
    </div>
  );
}
