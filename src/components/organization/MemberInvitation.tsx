import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Mail, Briefcase, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { UpgradeGateModal } from '@/components/subscription/UpgradeGateModal';

interface MemberInvitationProps {
  organizationId: string;
  onInviteSent: () => void;
  teamSize: number;
}

export function MemberInvitation({ organizationId, onInviteSent, teamSize }: MemberInvitationProps) {
  const [open, setOpen] = useState(false);
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'viewer' as const,
    department: '',
    title: '',
    message: ''
  });
  const { toast } = useToast();
  const { canAddUser, getUserLimitDisplay, pricingTier } = useSubscriptionFeatures();

  const isUnlimited = pricingTier?.users_limit === -1;
  const isStarter = pricingTier?.slug === 'starter';

  const handleInviteClick = () => {
    if (canAddUser(teamSize)) {
      setOpen(true);
    } else {
      setShowUpgradeGate(true);
    }
  };

  const getButtonText = () => {
    if (isUnlimited) {
      return 'Invite Team Member';
    }
    const limit = pricingTier?.users_limit ?? 1;
    return `Invite (${teamSize}/${limit})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('team-invite', {
        body: {
          organizationId,
          email: formData.email,
          role: formData.role,
          department: formData.department || null,
          message: formData.message || null,
        },
      });

      if (error) {
        // Parse the error response from the edge function
        const errorBody = typeof error === 'object' && 'context' in error
          ? await (error as any).context?.json?.() ?? {}
          : {};

        if (errorBody?.error === 'User limit reached') {
          setOpen(false);
          setShowUpgradeGate(true);
          return;
        }

        throw new Error(errorBody?.error || 'Failed to send invitation');
      }

      toast({
        title: 'Invitation sent',
        description: data?.message || `Invitation has been sent to ${formData.email}`,
      });

      setFormData({
        email: '',
        role: 'viewer',
        department: '',
        title: '',
        message: ''
      });
      setOpen(false);
      onInviteSent();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button size="sm" className="flex items-center gap-2" onClick={handleInviteClick}>
          <UserPlus className="h-4 w-4" />
          {getButtonText()}
        </Button>
        {isStarter && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Free plan: 1 user only. Upgrade for unlimited team members.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. The invitation will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  <SelectItem value="editor">Editor - Can create and edit content</SelectItem>
                  <SelectItem value="manager">Manager - Team management access</SelectItem>
                  <SelectItem value="admin">Admin - Full administrative access</SelectItem>
                  <SelectItem value="billing_admin">Billing Admin - Billing management only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    placeholder="Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="title"
                    placeholder="Software Engineer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Welcome to our team! Looking forward to working with you."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeGateModal
        open={showUpgradeGate}
        onOpenChange={setShowUpgradeGate}
        reason="user_limit"
      />
    </>
  );
}
