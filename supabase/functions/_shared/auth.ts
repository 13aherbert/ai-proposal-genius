import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "./cors.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Validate the JWT on the request and return the user, or a 401 Response.
 * Usage:
 *   const auth = await requireUser(req);
 *   if (auth instanceof Response) return auth;
 *   const userId = auth.id;
 */
export async function requireUser(req: Request): Promise<AuthenticatedUser | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/**
 * Verify the authenticated user has access to the project's organization.
 * Returns true if member (active), false otherwise.
 */
export async function userCanAccessProject(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { data: project } = await serviceClient
    .from("projects")
    .select("organization_id, user_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!project) return false;
  if (project.user_id === userId) return true;
  if (!project.organization_id) return false;
  const { data: member } = await serviceClient
    .from("organization_members")
    .select("id")
    .eq("organization_id", project.organization_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return !!member;
}

export function forbidden(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
