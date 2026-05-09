
DROP POLICY IF EXISTS "Only project members can access presence" ON realtime.messages;

CREATE POLICY "Only project members can access presence"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'presence-%' THEN
      EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.project_id::text = substring(realtime.topic() FROM 'presence-(.*)$')
          AND (
            p.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.project_collaborators pc
              WHERE pc.project_id = p.project_id AND pc.user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1 FROM public.organization_members om
              WHERE om.organization_id = p.organization_id
                AND om.user_id = auth.uid()
                AND om.status = 'active'
                AND om.role IN ('owner','admin')
            )
          )
      )
    ELSE false
  END
);

REVOKE SELECT (credentials) ON public.organization_integrations FROM authenticated;
REVOKE SELECT (credentials) ON public.organization_integrations FROM anon;
