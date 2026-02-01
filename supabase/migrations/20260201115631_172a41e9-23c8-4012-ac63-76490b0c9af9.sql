-- Archive existing beta data before deletion
CREATE TABLE IF NOT EXISTS archived_beta_invitations AS 
SELECT *, NOW() as archived_at FROM beta_invitations;

CREATE TABLE IF NOT EXISTS archived_beta_requests AS 
SELECT *, NOW() as archived_at FROM beta_requests;

-- Remove beta_tester role from all users
DELETE FROM user_roles WHERE role = 'beta_tester';

-- Drop beta tables
DROP TABLE IF EXISTS beta_invitations;
DROP TABLE IF EXISTS beta_requests;

-- Drop beta-related functions
DROP FUNCTION IF EXISTS check_beta_tester_role(uuid);
DROP FUNCTION IF EXISTS verify_invitation_code(text);
DROP FUNCTION IF EXISTS verify_invitation_code_secure(text);
DROP FUNCTION IF EXISTS invite_beta_tester(text, uuid);
DROP FUNCTION IF EXISTS update_beta_invitation_status(uuid, text, timestamptz);
DROP FUNCTION IF EXISTS update_beta_invitation_email_sent(uuid, boolean);
DROP FUNCTION IF EXISTS check_pending_invitation(text);
DROP FUNCTION IF EXISTS get_beta_invitation_direct(uuid);
DROP FUNCTION IF EXISTS get_invitation_for_email(text, text);
DROP FUNCTION IF EXISTS log_invitation_verification(text, boolean);