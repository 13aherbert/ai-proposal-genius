import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url, organizationId, deadline, title } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "Organization ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is an active member of the requested organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!membership) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scrape URL with Firecrawl
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl is not configured. Please connect Firecrawl in project settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scraping URL:", formattedUrl);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      const errorMsg = scrapeResponse.status === 402
        ? "Firecrawl credits exhausted. Please top up your Firecrawl plan."
        : scrapeData.error || `Scrape failed with status ${scrapeResponse.status}`;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || "";

    if (!markdown || markdown.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Page content too short or empty. The URL may require authentication or have no readable content." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scraped ${markdown.length} chars, page title: "${pageTitle}"`);

    // Determine project title
    const projectTitle = title || pageTitle || new URL(formattedUrl).hostname;

    // Upload markdown to storage
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 7);
    const safeTitle = projectTitle.replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 50);
    const fileName = `${timestamp}-${randomId}-${safeTitle}.md`;

    const encoder = new TextEncoder();
    const fileContent = encoder.encode(
      `# ${projectTitle}\n\nSource: ${formattedUrl}\n\n---\n\n${markdown}`
    );

    const { error: uploadError } = await supabase.storage
      .from("rfp-files")
      .upload(fileName, fileContent, {
        contentType: "text/markdown",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to store scraped content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create project
    const projectId = crypto.randomUUID();
    const { error: projectError } = await supabase
      .from("projects")
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: projectTitle,
        status: "draft",
        rfp_file_path: fileName,
        deadline: deadline || null,
        organization_id: organizationId,
      });

    if (projectError) {
      console.error("Project creation error:", projectError);
      return new Response(
        JSON.stringify({ error: projectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wordCount = markdown.split(/\s+/).length;
    console.log(`Project ${projectId} created from URL. Words: ${wordCount}`);

    return new Response(
      JSON.stringify({
        projectId,
        filePath: fileName,
        title: projectTitle,
        scrapedContent: { wordCount, title: pageTitle },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scrape-rfp-url error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
