-- Enable RLS on archived tables and add policies for system admins only
ALTER TABLE archived_beta_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_beta_requests ENABLE ROW LEVEL SECURITY;

-- Only system admins can access archived data
CREATE POLICY "System admins can view archived beta invitations"
ON archived_beta_invitations FOR SELECT
USING (is_system_admin());

CREATE POLICY "System admins can view archived beta requests"
ON archived_beta_requests FOR SELECT
USING (is_system_admin());