
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { BetaInvitation } from "@/services/admin/types";
import { adminService } from "@/services/admin";
import { toast } from "sonner";

interface BetaInvitationsProps {
  invitations: BetaInvitation[];
  isLoadingInvitations: boolean;
  loadInvitations: () => Promise<void>;
}

/**
 * Component for managing beta test invitations
 */
export function BetaInvitations({ 
  invitations, 
  isLoadingInvitations,
  loadInvitations 
}: BetaInvitationsProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [creatingInvitation, setCreatingInvitation] = useState(false);

  const handleSendInvitation = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    if (!inviteEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    try {
      setCreatingInvitation(true);
      const result = await adminService.createBetaInvitation(inviteEmail);
      if (result) {
        setInviteEmail('');
        await loadInvitations();
        toast.success("Invitation created and email sent successfully");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error("Failed to create invitation", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const success = await adminService.cancelBetaInvitation(invitationId);
      if (success) {
        await loadInvitations();
        toast.success("Invitation canceled successfully");
      }
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast.error("Failed to cancel invitation", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      setSendingEmail(invitationId);
      const success = await adminService.resendInvitationEmail(invitationId);
      if (success) {
        await loadInvitations();
        toast.success(`Invitation email sent to ${email}`);
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to send invitation email", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/beta?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta Invitations</CardTitle>
        <CardDescription>Manage beta testing program invitations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingInvitations ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Email Sent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length > 0 ? (
                invitations.map(invitation => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={invitation.status === 'pending' ? 'outline' : invitation.status === 'accepted' ? 'default' : 'secondary'}>
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {new Date(invitation.expires_at).toLocaleDateString()}
                      {new Date(invitation.expires_at) < new Date() && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invitation.invitation_email_sent ? 'default' : 'outline'}>
                        {invitation.invitation_email_sent ? 'Sent' : 'Not Sent'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyInviteLink(invitation.invite_code)}
                            >
                              Copy Link
                            </Button>
                            {!invitation.invitation_email_sent && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                                disabled={sendingEmail === invitation.id}
                              >
                                {sendingEmail === invitation.id ? (
                                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</>
                                ) : (
                                  <><Mail className="h-4 w-4 mr-1" /> Send Email</>
                                )}
                              </Button>
                            )}
                            {invitation.invitation_email_sent && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                                disabled={sendingEmail === invitation.id}
                              >
                                {sendingEmail === invitation.id ? (
                                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</>
                                ) : (
                                  <><Mail className="h-4 w-4 mr-1" /> Resend</>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No invitations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex space-x-2 w-full">
          <Input 
            placeholder="Email address" 
            value={inviteEmail} 
            onChange={e => setInviteEmail(e.target.value)} 
            className="flex-1" 
          />
          <Button 
            onClick={handleSendInvitation}
            disabled={creatingInvitation}
          >
            {creatingInvitation ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Inviting...</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" /> Invite</>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
