import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// In-memory rate limit tracking (per isolate)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(keyId: string, rpm: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(keyId);
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitMap.set(keyId, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= rpm;
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function errorResponse(code: string, message: string, status: number) {
  return jsonResponse({ error: { code, message } }, status);
}

// Parse path segments from the function URL
// Edge function URL: /public-api/projects/:id/sections
function parsePath(url: string): string[] {
  const u = new URL(url);
  const pathname = u.pathname;
  // Remove the /public-api prefix
  const match = pathname.match(/\/public-api\/(.*)/);
  if (!match) return [];
  return match[1].split('/').filter(Boolean);
}

function getQueryParams(url: string) {
  const u = new URL(url);
  const page = Math.max(1, parseInt(u.searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(u.searchParams.get('per_page') || '50', 10)));
  const search = u.searchParams.get('search') || undefined;
  return { page, perPage, search };
}

interface ApiKeyRecord {
  id: string;
  organization_id: string;
  permissions: Record<string, string[]>;
  rate_limit_rpm: number;
  api_key_hash: string;
}

async function authenticateApiKey(authHeader: string | null): Promise<
  { key: ApiKeyRecord } | { error: Response }
> {
  if (!authHeader?.startsWith('Bearer oak_')) {
    return { error: errorResponse('UNAUTHORIZED', 'Missing or invalid API key. Use Authorization: Bearer oak_...', 401) };
  }

  const apiKey = authHeader.replace('Bearer ', '');
  if (!apiKey.startsWith('oak_') || apiKey.length !== 68) {
    return { error: errorResponse('UNAUTHORIZED', 'Invalid API key format', 401) };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Fetch only active, non-expired keys
  const { data: keys, error } = await admin
    .from('organization_api_keys')
    .select('id, organization_id, permissions, rate_limit_rpm, api_key_hash')
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .limit(100);

  if (error || !keys?.length) {
    return { error: errorResponse('UNAUTHORIZED', 'Invalid API key', 401) };
  }

  // Compare against each hash until match
  for (const key of keys) {
    try {
      const matches = await bcrypt.compare(apiKey, key.api_key_hash);
      if (matches) {
        // Update last_used_at asynchronously (fire-and-forget)
        admin
          .from('organization_api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', key.id)
          .then(() => {});

        return {
          key: {
            id: key.id,
            organization_id: key.organization_id,
            permissions: (key.permissions as Record<string, string[]>) || {},
            rate_limit_rpm: key.rate_limit_rpm ?? 100,
            api_key_hash: key.api_key_hash,
          },
        };
      }
    } catch {
      // bcrypt error, skip this key
    }
  }

  return { error: errorResponse('UNAUTHORIZED', 'Invalid API key', 401) };
}

function hasPermission(permissions: Record<string, string[]>, resource: string, action: string): boolean {
  const actions = permissions[resource];
  if (!actions) return false;
  return actions.includes(action);
}

async function checkSubscription(orgId: string): Promise<boolean> {
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await admin
    .from('organization_subscriptions')
    .select('plan_type, status')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  if (!data) return false;
  return ['business', 'enterprise', 'white_label', 'pro'].includes(data.plan_type);
}

// ─── Route Handlers ─────────────────────────────────────────

async function handleListProjects(orgId: string, url: string) {
  const { page, perPage } = getQueryParams(url);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await admin
    .from('projects')
    .select('project_id, title, status, client_name, deadline, created_at, updated_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return errorResponse('INTERNAL_ERROR', 'Failed to fetch projects', 500);

  return jsonResponse({
    data: data || [],
    meta: { total: count || 0, page, per_page: perPage },
  });
}

async function handleGetProject(orgId: string, projectId: string) {
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await admin
    .from('projects')
    .select('project_id, title, status, client_name, business_name, deadline, analysis, proposal_outline, created_at, updated_at')
    .eq('organization_id', orgId)
    .eq('project_id', projectId)
    .single();

  if (error || !data) return errorResponse('NOT_FOUND', 'Project not found', 404);
  return jsonResponse({ data });
}

async function handleGetProjectSections(orgId: string, projectId: string, url: string) {
  const { page, perPage } = getQueryParams(url);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Verify project belongs to org
  const { data: project } = await admin
    .from('projects')
    .select('project_id')
    .eq('organization_id', orgId)
    .eq('project_id', projectId)
    .single();

  if (!project) return errorResponse('NOT_FOUND', 'Project not found', 404);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await admin
    .from('proposal_sections')
    .select('section_id, section_title, content, created_at, updated_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) return errorResponse('INTERNAL_ERROR', 'Failed to fetch sections', 500);

  return jsonResponse({
    data: data || [],
    meta: { total: count || 0, page, per_page: perPage },
  });
}

async function handleListKnowledgeBase(orgId: string, url: string) {
  const { page, perPage, search } = getQueryParams(url);
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = admin
    .from('knowledge_entries')
    .select('entry_id, title, category, content, created_at, updated_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) return errorResponse('INTERNAL_ERROR', 'Failed to fetch knowledge entries', 500);

  return jsonResponse({
    data: data || [],
    meta: { total: count || 0, page, per_page: perPage },
  });
}

async function handleGetKnowledgeEntry(orgId: string, entryId: string) {
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await admin
    .from('knowledge_entries')
    .select('entry_id, title, category, content, parsed_content, file_metadata, created_at, updated_at')
    .eq('organization_id', orgId)
    .eq('entry_id', entryId)
    .single();

  if (error || !data) return errorResponse('NOT_FOUND', 'Knowledge entry not found', 404);
  return jsonResponse({ data });
}

async function handleCreateProject(orgId: string, body: unknown) {
  if (!body || typeof body !== 'object') {
    return errorResponse('VALIDATION_ERROR', 'Request body is required', 400);
  }

  const { title, client_name, deadline } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return errorResponse('VALIDATION_ERROR', 'title is required and must be a non-empty string', 400);
  }
  if (title.length > 500) {
    return errorResponse('VALIDATION_ERROR', 'title must be 500 characters or less', 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Get the org owner as the user_id for the project
  const { data: owner } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .limit(1)
    .single();

  if (!owner) return errorResponse('INTERNAL_ERROR', 'Organization owner not found', 500);

  const { data, error } = await admin
    .from('projects')
    .insert({
      title: title.trim(),
      organization_id: orgId,
      user_id: owner.user_id,
      rfp_file_path: 'api-created',
      client_name: typeof client_name === 'string' ? client_name.trim() : null,
      deadline: typeof deadline === 'string' ? deadline : null,
      status: 'new',
    })
    .select('project_id, title, status, client_name, deadline, created_at')
    .single();

  if (error) return errorResponse('INTERNAL_ERROR', 'Failed to create project', 500);
  return jsonResponse({ data }, 201);
}

async function handleCreateKnowledgeEntry(orgId: string, body: unknown) {
  if (!body || typeof body !== 'object') {
    return errorResponse('VALIDATION_ERROR', 'Request body is required', 400);
  }

  const { title, category, content } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return errorResponse('VALIDATION_ERROR', 'title is required', 400);
  }
  if (!category || typeof category !== 'string') {
    return errorResponse('VALIDATION_ERROR', 'category is required', 400);
  }
  if (title.length > 500) {
    return errorResponse('VALIDATION_ERROR', 'title must be 500 characters or less', 400);
  }
  if (typeof content === 'string' && content.length > 50000) {
    return errorResponse('VALIDATION_ERROR', 'content must be 50,000 characters or less', 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: owner } = await admin
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .limit(1)
    .single();

  if (!owner) return errorResponse('INTERNAL_ERROR', 'Organization owner not found', 500);

  const { data, error } = await admin
    .from('knowledge_entries')
    .insert({
      title: title.trim(),
      category: category.trim(),
      content: typeof content === 'string' ? content : null,
      organization_id: orgId,
      user_id: owner.user_id,
    })
    .select('entry_id, title, category, content, created_at')
    .single();

  if (error) return errorResponse('INTERNAL_ERROR', 'Failed to create knowledge entry', 500);
  return jsonResponse({ data }, 201);
}

// ─── Main Handler ────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(req.headers.get('Authorization'));
    if ('error' in authResult) return authResult.error;
    const { key } = authResult;

    // 2. Rate limit
    if (!checkRateLimit(key.id, key.rate_limit_rpm)) {
      return errorResponse('RATE_LIMITED', 'Too many requests. Try again later.', 429);
    }

    // 3. Check subscription
    const hasAccess = await checkSubscription(key.organization_id);
    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'API access requires a Business or Enterprise subscription', 403);
    }

    // 4. Route
    const segments = parsePath(req.url);
    const method = req.method;

    // GET /projects
    if (method === 'GET' && segments[0] === 'projects' && segments.length === 1) {
      if (!hasPermission(key.permissions, 'projects', 'read')) {
        return errorResponse('FORBIDDEN', 'API key lacks projects:read permission', 403);
      }
      return handleListProjects(key.organization_id, req.url);
    }

    // GET /projects/:id
    if (method === 'GET' && segments[0] === 'projects' && segments.length === 2) {
      if (!hasPermission(key.permissions, 'projects', 'read')) {
        return errorResponse('FORBIDDEN', 'API key lacks projects:read permission', 403);
      }
      return handleGetProject(key.organization_id, segments[1]);
    }

    // GET /projects/:id/sections
    if (method === 'GET' && segments[0] === 'projects' && segments.length === 3 && segments[2] === 'sections') {
      if (!hasPermission(key.permissions, 'proposals', 'read')) {
        return errorResponse('FORBIDDEN', 'API key lacks proposals:read permission', 403);
      }
      return handleGetProjectSections(key.organization_id, segments[1], req.url);
    }

    // GET /knowledge-base
    if (method === 'GET' && segments[0] === 'knowledge-base' && segments.length === 1) {
      if (!hasPermission(key.permissions, 'knowledge_base', 'read')) {
        return errorResponse('FORBIDDEN', 'API key lacks knowledge_base:read permission', 403);
      }
      return handleListKnowledgeBase(key.organization_id, req.url);
    }

    // GET /knowledge-base/:id
    if (method === 'GET' && segments[0] === 'knowledge-base' && segments.length === 2) {
      if (!hasPermission(key.permissions, 'knowledge_base', 'read')) {
        return errorResponse('FORBIDDEN', 'API key lacks knowledge_base:read permission', 403);
      }
      return handleGetKnowledgeEntry(key.organization_id, segments[1]);
    }

    // POST /projects
    if (method === 'POST' && segments[0] === 'projects' && segments.length === 1) {
      if (!hasPermission(key.permissions, 'projects', 'create')) {
        return errorResponse('FORBIDDEN', 'API key lacks projects:create permission', 403);
      }
      const body = await req.json().catch(() => null);
      return handleCreateProject(key.organization_id, body);
    }

    // POST /knowledge-base
    if (method === 'POST' && segments[0] === 'knowledge-base' && segments.length === 1) {
      if (!hasPermission(key.permissions, 'knowledge_base', 'create')) {
        return errorResponse('FORBIDDEN', 'API key lacks knowledge_base:create permission', 403);
      }
      const body = await req.json().catch(() => null);
      return handleCreateKnowledgeEntry(key.organization_id, body);
    }

    return errorResponse('NOT_FOUND', `Route not found: ${method} /${segments.join('/')}`, 404);
  } catch (err) {
    console.error('Public API error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
