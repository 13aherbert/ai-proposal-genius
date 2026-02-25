import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToHtml(md: string): string {
  let html = escapeHtml(md);
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Headers
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  // Lists
  html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  // Paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><(h[123]|ul|li)/g, "<$1");
  html = html.replace(/<\/(h[123]|ul|li)><\/p>/g, "</$1>");
  return html;
}

interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  margins: "narrow" | "normal" | "wide";
  logoUrl?: string;
}

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

function renderBlockToHtml(block: ContentBlock, allBlocks: ContentBlock[], settings: DesignSettings): string {
  const c = block.content;
  switch (block.type) {
    case "cover":
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;background:${settings.primaryColor};color:#fff;text-align:center;padding:60px;page-break-after:always;">
        <h1 style="font-size:36px;font-family:${settings.headerFont};margin-bottom:16px;">${escapeHtml(String(c.title || "Proposal"))}</h1>
        <p style="font-size:20px;opacity:0.9;margin-bottom:24px;">${escapeHtml(String(c.subtitle || ""))}</p>
        <p style="font-size:14px;opacity:0.7;">${escapeHtml(String(c.date || ""))}</p>
      </div>`;

    case "toc": {
      const headings = allBlocks
        .filter((b) => b.type === "heading")
        .map((b, i) => `<li style="margin:6px 0;"><span style="color:${settings.primaryColor};font-weight:600;">${i + 1}.</span> ${escapeHtml(String(b.content.text || ""))}</li>`);
      return `<div style="padding:40px 0;page-break-after:always;">
        <h2 style="font-family:${settings.headerFont};color:${settings.primaryColor};margin-bottom:16px;">Table of Contents</h2>
        <ul style="list-style:none;padding:0;">${headings.join("")}</ul>
      </div>`;
    }

    case "heading": {
      const lvl = Number(c.level) || 2;
      const sizes: Record<number, string> = { 1: "28px", 2: "22px", 3: "18px" };
      return `<h${lvl} style="font-family:${settings.headerFont};color:${settings.primaryColor};font-size:${sizes[lvl] || "22px"};border-bottom:2px solid ${settings.primaryColor}20;padding-bottom:8px;margin-top:24px;">${escapeHtml(String(c.text || ""))}</h${lvl}>`;
    }

    case "text":
      return `<div style="font-family:${settings.bodyFont};line-height:1.7;font-size:14px;">${markdownToHtml(String(c.text || ""))}</div>`;

    case "image":
      return `<figure style="text-align:center;margin:24px 0;">
        ${c.url ? `<img src="${escapeHtml(String(c.url))}" style="max-width:100%;border-radius:8px;" />` : ""}
        ${c.caption ? `<figcaption style="font-size:12px;color:#666;margin-top:8px;">${escapeHtml(String(c.caption))}</figcaption>` : ""}
      </figure>`;

    case "table": {
      const headers = (c.headers as string[]) || [];
      const rows = (c.rows as string[][]) || [];
      return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead><tr style="background:${settings.primaryColor};color:#fff;">${headers.map((h) => `<th style="padding:8px 12px;text-align:left;">${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row, i) => `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">${row.map((cell) => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
    }

    case "divider":
      return `<hr style="border:none;border-top:1px solid ${settings.primaryColor}30;margin:32px 0;page-break-after:always;" />`;

    case "quote":
      return `<blockquote style="border-left:4px solid ${settings.primaryColor};padding-left:16px;margin:16px 0;font-style:italic;color:${settings.secondaryColor};">${escapeHtml(String(c.text || ""))}</blockquote>`;

    case "callout": {
      const variant = String(c.variant || "info");
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
        warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
        success: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
      };
      const v = colors[variant] || colors.info;
      return `<div style="background:${v.bg};border-left:4px solid ${v.border};padding:16px;border-radius:8px;margin:16px 0;color:${v.text};font-size:14px;">${escapeHtml(String(c.text || ""))}</div>`;
    }

    default:
      return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.user.id;

    // Parse body
    const { designId } = await req.json();
    if (!designId) {
      return new Response(JSON.stringify({ error: "Missing designId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load design with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: design, error: designErr } = await adminClient
      .from("proposal_designs")
      .select("*")
      .eq("id", designId)
      .single();

    if (designErr || !design) {
      return new Response(JSON.stringify({ error: "Design not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify org membership
    const { data: membership } = await adminClient
      .from("organization_members")
      .select("id")
      .eq("organization_id", design.organization_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const settings = design.design_settings as DesignSettings;
    const blocks = (design.content_blocks as ContentBlock[]) || [];
    const marginPx: Record<string, string> = { narrow: "24px", normal: "48px", wide: "72px" };

    const bodyHtml = blocks.map((b) => renderBlockToHtml(b, blocks, settings)).join("\n");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proposal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Georgia&family=Merriweather:wght@400;700&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${settings.bodyFont}, sans-serif; color: #1a1a1a; padding: ${marginPx[settings.margins] || "48px"}; }
    @media print {
      body { padding: ${marginPx[settings.margins] || "48px"}; }
      @page { margin: 0; size: letter; }
    }
    img { max-width: 100%; }
    h1, h2, h3 { font-family: ${settings.headerFont}, sans-serif; }
    p { margin: 8px 0; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

    // Return HTML for client-side print-to-PDF
    return new Response(JSON.stringify({ html: fullHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("export-proposal-pdf error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
