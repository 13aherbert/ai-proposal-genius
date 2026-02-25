import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function scoreFilenameForPrimary(filename: string): number {
  const lower = filename.toLowerCase();
  let score = 0;

  // Positive indicators: likely the main RFP/SOW document
  const positiveKeywords = [
    { pattern: /solicitation/i, weight: 10 },
    { pattern: /statement\s*of\s*work|sow/i, weight: 10 },
    { pattern: /performance\s*work\s*statement|pws/i, weight: 10 },
    { pattern: /combined\s*synopsis/i, weight: 8 },
    { pattern: /\brfp\b/i, weight: 8 },
    { pattern: /\brfq\b/i, weight: 7 },
    { pattern: /\brfi\b/i, weight: 5 },
    { pattern: /scope/i, weight: 6 },
    { pattern: /synopsis/i, weight: 5 },
    { pattern: /description/i, weight: 3 },
  ];

  // Negative indicators: supporting/administrative documents
  const negativeKeywords = [
    { pattern: /amendment|amend/i, weight: -8 },
    { pattern: /modification|mod\d/i, weight: -8 },
    { pattern: /wage\s*determin/i, weight: -10 },
    { pattern: /\bsf[\-_]?\d/i, weight: -7 },
    { pattern: /sf1449|sf\s*1449/i, weight: -7 },
    { pattern: /addendum/i, weight: -6 },
    { pattern: /attachment\s*[a-z]/i, weight: -3 },
    { pattern: /exhibit/i, weight: -3 },
    { pattern: /clauses/i, weight: -5 },
    { pattern: /provisions/i, weight: -4 },
    { pattern: /representations/i, weight: -4 },
    { pattern: /certifications/i, weight: -4 },
    { pattern: /far\s*\d/i, weight: -5 },
    { pattern: /dfar/i, weight: -5 },
    { pattern: /register/i, weight: -3 },
    { pattern: /checklist/i, weight: -3 },
  ];

  for (const kw of positiveKeywords) {
    if (kw.pattern.test(lower)) score += kw.weight;
  }
  for (const kw of negativeKeywords) {
    if (kw.pattern.test(lower)) score += kw.weight;
  }

  return score;
}

function selectPrimaryFile(files: { path: string; name: string; isPdf: boolean; size: number }[]): string {
  const pdfs = files.filter(f => f.isPdf);
  const candidates = pdfs.length > 0 ? pdfs : files;

  // Score each file
  const scored = candidates.map(f => ({
    ...f,
    score: scoreFilenameForPrimary(f.name),
  }));

  // Sort by score desc, then by size desc (larger files are more likely the main doc)
  scored.sort((a, b) => b.score - a.score || b.size - a.size);

  console.log(`[fetch-docs] File scoring results:`, scored.map(s => `${s.name}: score=${s.score}, size=${s.size}`));

  return scored[0].path;
}

function getFilenameFromResponse(res: Response, url: string): string {
  const cd = res.headers.get("content-disposition");
  if (cd) {
    const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) return match[1].replace(/['"]/g, "").trim();
  }
  // Extract from URL path
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes(".")) return decodeURIComponent(last);
  } catch {}
  return `document_${Date.now()}.pdf`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const samApiKey = Deno.env.get("SAM_GOV_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use service role for storage uploads (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Get org
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_organization_id")
      .eq("profile_id", userId)
      .single();

    if (!profile?.current_organization_id) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const orgId = profile.current_organization_id;

    // Verify membership
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not an active organization member" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from("organization_subscriptions")
      .select("plan_type, project_limit")
      .eq("organization_id", orgId)
      .single();

    const planType = subscription?.plan_type?.toLowerCase() || "trial";
    if (!["pro", "enterprise", "white_label"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Pro or Enterprise subscription required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check project limit
    const projectLimit = subscription?.project_limit || 3;
    const { count: projectCount } = await supabase
      .from("projects")
      .select("project_id", { count: "exact", head: true })
      .eq("organization_id", orgId);

    if (projectCount !== null && projectCount >= projectLimit) {
      return new Response(
        JSON.stringify({ error: "Project limit reached. Please upgrade or delete existing projects." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      resourceLinks = [],
      descriptionTextUrl,
      title,
      deadline,
      agency,
      source,
    } = body as {
      resourceLinks: string[];
      descriptionTextUrl?: string | null;
      title: string;
      deadline?: string | null;
      agency?: string | null;
      source?: string;
    };

    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadedFiles: { path: string; name: string; isPdf: boolean; size: number }[] = [];
    let primaryFilePath: string | null = null;
    const warnings: string[] = [];

    // Download resource links (SAM.gov attachments)
    for (const linkUrl of resourceLinks.slice(0, 10)) {
      try {
        // Append API key for SAM.gov URLs
        let fetchUrl = linkUrl;
        if (samApiKey && linkUrl.includes("api.sam.gov")) {
          const sep = linkUrl.includes("?") ? "&" : "?";
          fetchUrl = `${linkUrl}${sep}api_key=${samApiKey}`;
        }

        console.log(`[fetch-docs] Downloading: ${linkUrl}`);
        const res = await fetch(fetchUrl, { 
          headers: { Accept: "*/*" },
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          console.warn(`[fetch-docs] Failed to download ${linkUrl}: ${res.status}`);
          warnings.push(`Failed to download: ${linkUrl} (${res.status})`);
          continue;
        }

        // Check size via Content-Length if available
        const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
        if (contentLength > MAX_FILE_SIZE) {
          warnings.push(`Skipped large file (${Math.round(contentLength / 1024 / 1024)}MB): ${linkUrl}`);
          continue;
        }

        const blob = await res.blob();
        if (blob.size > MAX_FILE_SIZE) {
          warnings.push(`Skipped large file (${Math.round(blob.size / 1024 / 1024)}MB): ${linkUrl}`);
          continue;
        }

        const filename = getFilenameFromResponse(res, linkUrl);
        const storagePath = `${orgId}/${userId}/${Date.now()}_${filename}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("rfp-files")
          .upload(storagePath, blob, {
            contentType: res.headers.get("content-type") || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error(`[fetch-docs] Upload error for ${filename}:`, uploadError);
          warnings.push(`Failed to upload: ${filename}`);
          continue;
        }

        const isPdf = filename.toLowerCase().endsWith(".pdf") || 
                       (res.headers.get("content-type") || "").includes("pdf");
        uploadedFiles.push({ path: storagePath, name: filename, isPdf, size: blob.size });

        console.log(`[fetch-docs] Uploaded: ${storagePath} (${blob.size} bytes)`);
      } catch (err) {
        console.error(`[fetch-docs] Error downloading ${linkUrl}:`, err);
        warnings.push(`Error downloading: ${linkUrl}`);
      }
    }

    // Fallback: fetch description text if no files downloaded
    if (uploadedFiles.length === 0 && descriptionTextUrl) {
      try {
        let fetchUrl = descriptionTextUrl;
        if (samApiKey && descriptionTextUrl.includes("api.sam.gov")) {
          const sep = descriptionTextUrl.includes("?") ? "&" : "?";
          fetchUrl = `${descriptionTextUrl}${sep}api_key=${samApiKey}`;
        }

        console.log(`[fetch-docs] Fetching description text: ${descriptionTextUrl}`);
        const res = await fetch(fetchUrl, {
          headers: { Accept: "text/html, text/plain, */*" },
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const text = await res.text();
          if (text.length > 100) {
            const filename = `notice_description_${Date.now()}.txt`;
            const storagePath = `${orgId}/${userId}/${filename}`;
            const blob = new Blob([text], { type: "text/plain" });

            const { error: uploadError } = await supabaseAdmin.storage
              .from("rfp-files")
              .upload(storagePath, blob, {
                contentType: "text/plain",
                upsert: false,
              });

            if (!uploadError) {
              uploadedFiles.push({ path: storagePath, name: filename, isPdf: false });
              primaryFilePath = storagePath;
              console.log(`[fetch-docs] Uploaded description text: ${storagePath}`);
            }
          }
        }
      } catch (err) {
        console.error("[fetch-docs] Error fetching description:", err);
      }
    }

    // If still no files, return error to trigger fallback
    if (uploadedFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No documents could be downloaded from this opportunity",
          warnings,
          fallback: true,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Intelligent primary file selection using filename scoring
    primaryFilePath = selectPrimaryFile(uploadedFiles);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title,
        rfp_file_path: primaryFilePath,
        organization_id: orgId,
        user_id: userId,
        status: "draft",
        deadline: deadline || null,
        client_name: agency || null,
      })
      .select("project_id")
      .single();

    if (projectError || !project) {
      console.error("[fetch-docs] Project creation error:", projectError);
      return new Response(
        JSON.stringify({ error: "Failed to create project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create project_documents rows
    for (const file of uploadedFiles) {
      await supabase.from("project_documents").insert({
        project_id: project.project_id,
        user_id: userId,
        file_name: file.name,
        file_path: file.path,
        document_type: file.isPdf ? "rfp" : "supporting",
      });
    }

    // Record usage
    await supabase.rpc("update_organization_usage_metric", {
      org_id: orgId,
      metric_type_param: "opportunity_document_fetches",
      increment_value: 1,
    });

    console.log(`[fetch-docs] Created project ${project.project_id} with ${uploadedFiles.length} files`);

    return new Response(
      JSON.stringify({
        projectId: project.project_id,
        filesDownloaded: uploadedFiles.length,
        primaryFilePath,
        warnings,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-opportunity-documents:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
