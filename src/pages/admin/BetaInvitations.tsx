import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, UserPlus, Loader2, AlertTriangle, Copy, Check } from "lucide-react";
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
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});
  
  const [operationInProgress, setOperationInProgress] = useState(false);

  const handleSendInvitation = async () => {
    if (operationInProgress || creatingInvitation) {
      toast.info("Operation already in progress");
      return;
    }
    
    setEmailError(null);
    
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
      setOperationInProgress(true);
      console.log(`Starting invitation process for ${inviteEmail}`);
      const result = await adminService.createBetaInvitation(inviteEmail);
      console.log(`Invitation creation result:`, result);
      
      if (result) {
        setInviteEmail('');
        await loadInvitations();
        toast.success(`Invitation email sent to ${inviteEmail}`, {
          description: "The user will receive an email with instructions to join the beta program."
        });
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      setEmailError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to create invitation", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setCreatingInvitation(false);
      setTimeout(() => setOperationInProgress(false), 1000);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (operationInProgress) {
      toast.info("Operation already in progress");
      return;
    }
    
    try {
      setOperationInProgress(true);
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
    } finally {
      setTimeout(() => setOperationInProgress(false), 1000);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    if (sendingEmail[invitationId] || operationInProgress) {
      toast.info("Email sending already in progress");
      return;
    }
    
    try {
      setSendingEmail(prev => ({ ...prev, [invitationId]: true }));
      setOperationInProgress(true);
      
      console.log(`Attempting to resend invitation to ${email} (ID: ${invitationId})`);
      const result = await adminService.resendInvitationEmail(invitationId);
      console.log(`Resend result:`, result);
      
      if (result) {
        await loadInvitations();
        toast.success(`Invitation email sent to ${email}`, {
          description: "The user will receive an email with beta program details."
        });
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to send invitation email", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSendingEmail(prev => ({ ...prev, [invitationId]: false }));
      setTimeout(() => setOperationInProgress(false), 1000);
    }
  };

  const copyInviteLink = (inviteCode: string, id: string) => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/beta?invite=${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    
    setCopiedIds(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedIds(prev => ({ ...prev, [id]: false }));
    }, 2000);
    
    toast.success("Invite link copied to clipboard");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
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
                  <TableRow key={invitation.id} className={isExpired(invitation.expires_at) ? "opacity-60" : ""}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invitation.status === 'pending' ? 'outline' : 
                        invitation.status === 'accepted' ? 'default' : 
                        invitation.status === 'canceled' ? 'destructive' : 
                        'secondary'
                      }>
                        {invitation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(invitation.created_at)}</TableCell>
                    <TableCell>
                      {formatDateTime(invitation.expires_at)}
                      {isExpired(invitation.expires_at) && (
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
                        {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyInviteLink(invitation.invite_code, invitation.id)}
                            >
                              {copiedIds[invitation.id] ? (
                                <><Check className="h-4 w-4 mr-1" /> Copied</>
                              ) : (
                                <><Copy className="h-4 w-4 mr-1" /> Copy Link</>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                              disabled={sendingEmail[invitation.id]}
                            >
                              {sendingEmail[invitation.id] ? (
                                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</>
                              ) : (
                                <><Mail className="h-4 w-4 mr-1" /> {invitation.invitation_email_sent ? 'Resend' : 'Send Email'}</>
                              )}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleCancelInvitation(invitation.id)}
                              disabled={operationInProgress}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {isExpired(invitation.expires_at) && (
                          <span className="text-sm text-muted-foreground">Expired</span>
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
        <div className="flex flex-col w-full space-y-2">
          <div className="flex space-x-2 w-full">
            <Input 
              placeholder="Email address" 
              value={inviteEmail} 
              onChange={e => {
                setInviteEmail(e.target.value);
                setEmailError(null);
              }} 
              className="flex-1" 
            />
            <Button 
              onClick={handleSendInvitation}
              disabled={creatingInvitation || operationInProgress}
            >
              {creatingInvitation ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Inviting...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Invite</>
              )}
            </Button>
          </div>
          
          {emailError && (
            <div className="text-destructive text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {emailError}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default BetaInvitations;
