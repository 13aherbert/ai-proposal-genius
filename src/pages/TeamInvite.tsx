import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { MemberInvitation } from '@/components/organization/MemberInvitation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamInvite() {
  const { organization } = useCurrentOrganization();
  const { members, fetchMembers } = useOrganizationMembers(organization?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/team">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invite Team Member</h1>
          <p className="text-muted-foreground">Send an invitation to join your organization.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {organization?.id ? (
            <MemberInvitation
              organizationId={organization.id}
              onInviteSent={fetchMembers}
              teamSize={members.length}
            />
          ) : (
            <p className="text-muted-foreground">No organization found. Please set up your organization first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
