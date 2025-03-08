
/**
 * Accept a beta invitation and assign beta_tester role to the user
 */
export async function acceptBetaInvitation(code: string): Promise<boolean> {
  try {
    console.log(`Accepting beta invitation with code: ${code}`);
    
    // First verify the invitation
    const invitation = await verifyBetaInvitation(code);
    if (!invitation) {
      toast.error("Invalid or expired invitation code");
      return false;
    }

    console.log(`Invitation verified:`, invitation);

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      toast.error("Authentication error", { description: "Could not verify your identity" });
      return false;
    }

    console.log(`User authenticated: ${userData.user.id}`);

    // Update invitation status using the edge function
    const currentTime = new Date().toISOString();
    const statusUpdated = await updateInvitationStatus(
      invitation.id, 
      'accepted', 
      currentTime
    );

    if (!statusUpdated) {
      console.error('Error updating beta invitation status');
      // Continue anyway to try adding the role
    } else {
      console.log(`Invitation status updated successfully`);
    }

    // Add beta_tester role to user using RPC function to avoid RLS issues
    const { data: roleData, error: roleError } = await supabase.rpc(
      'assign_user_role',
      {
        _user_id: userData.user.id,
        _role: 'beta_tester',
        _created_by: invitation.invited_by || userData.user.id
      }
    );

    if (roleError) {
      console.error('Error assigning beta_tester role:', roleError);
      toast.error("Failed to assign beta tester role");
      return false;
    }

    console.log(`Beta tester role assigned successfully`);
    toast.success("You have joined the beta program!");
    return true;
  } catch (error) {
    console.error('Error in acceptBetaInvitation:', error);
    toast.error("Failed to join beta program", { description: error instanceof Error ? error.message : "Unknown error" });
    return false;
  }
}
