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

function markdownTableToHtml(md: string, settings: { primaryColor: string }): string {
  const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\n)(?:\|[\s:|-]+\|\n)((?:\|[^\n]+\|\n?)*))/gm;
  return md.replace(tableRegex, (_match, fullTable: string) => {
    const lines = fullTable.trim().split('\n');
    if (lines.length < 2) return fullTable;
    const parseRow = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
    const headers = parseRow(lines[0]);
    const dataRows = lines.slice(2).map(parseRow);
    const thCells = headers.map(h => `<th style="padding:8px 12px;text-align:left;font-weight:600;">${escapeHtml(h)}</th>`).join('');
    const bodyRows = dataRows.map((row, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">${row.map(c => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(c)}</td>`).join('')}</tr>`
    ).join('');
    return `\n<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
<thead><tr style="background:${settings.primaryColor};color:#fff;">${thCells}</tr></thead>
<tbody>${bodyRows}</tbody>
</table>\n`;
  });
}

function markdownToHtml(md: string, settings?: { primaryColor: string }): string {
  let processed = md;
  if (settings) {
    processed = markdownTableToHtml(processed, settings);
  }
  const tables: string[] = [];
  processed = processed.replace(/<table[\s\S]*?<\/table>/g, (match) => {
    tables.push(match);
    return `__TABLE_PLACEHOLDER_${tables.length - 1}__`;
  });

  let html = escapeHtml(processed);
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:underline;">$1</a>');
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, "<oli>$1</oli>");
  html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (match) => `<ol style="padding-left:20px;">${match.replace(/<\/?oli>/g, (t) => t === '<oli>' ? '<li>' : '</li>')}</ol>`);
  // Unordered lists
  html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul style='padding-left:20px;'>$&</ul>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><(h[123]|ul|ol|li)/g, "<$1");
  html = html.replace(/<\/(h[123]|ul|ol|li)><\/p>/g, "</$1>");

  tables.forEach((table, i) => {
    html = html.replace(`__TABLE_PLACEHOLDER_${i}__`, table);
  });
  return html;
}

interface DesignSettings {
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  margins: "narrow" | "normal" | "wide";
  logoUrl?: string;
  headerStyle?: string;
  coverLayout?: string;
  sectionNumbering?: boolean;
}

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

function computeSectionNumbers(blocks: ContentBlock[]): Record<string, string> {
  const counters = [0, 0, 0];
  const result: Record<string, string> = {};
  for (const block of blocks) {
    if (block.type !== 'heading') continue;
    const level = Number(block.content.level) || 2;
    const idx = Math.min(level, 3) - 1;
    counters[idx]++;
    for (let i = idx + 1; i < counters.length; i++) counters[i] = 0;
    result[block.id] = counters.slice(0, idx + 1).join('.');
  }
  return result;
}

// --- Cover layout renderers ---

function renderCoverHtml(block: ContentBlock, settings: DesignSettings): string {
  const c = block.content;
  const title = escapeHtml(String(c.title || "Proposal"));
  const subtitle = escapeHtml(String(c.subtitle || ""));
  const date = escapeHtml(String(c.date || ""));
  const layout = settings.coverLayout || "centered";
  const logo = settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" style="max-height:60px;max-width:200px;object-fit:contain;" />` : "";

  switch (layout) {
    case "left-aligned":
      return `<div style="display:flex;flex-direction:column;justify-content:center;min-height:600px;background:${settings.primaryColor};color:#fff;padding:60px;page-break-after:always;">
        ${logo ? `<div style="margin-bottom:24px;">${logo}</div>` : ""}
        <h1 style="font-size:36px;font-family:${settings.headerFont};margin-bottom:12px;">${title}</h1>
        <p style="font-size:20px;opacity:0.9;margin-bottom:16px;">${subtitle}</p>
        <p style="font-size:14px;opacity:0.7;">${date}</p>
      </div>`;
    case "split":
      return `<div style="display:flex;min-height:600px;page-break-after:always;">
        <div style="width:50%;background:${settings.primaryColor};color:#fff;padding:48px;display:flex;flex-direction:column;justify-content:center;">
          ${logo ? `<div style="margin-bottom:24px;">${logo}</div>` : ""}
          <h1 style="font-size:32px;font-family:${settings.headerFont};margin-bottom:12px;">${title}</h1>
          <p style="font-size:14px;opacity:0.7;">${date}</p>
        </div>
        <div style="width:50%;background:${settings.secondaryColor};color:#fff;padding:48px;display:flex;flex-direction:column;justify-content:center;">
          <p style="font-size:18px;opacity:0.9;">${subtitle}</p>
        </div>
      </div>`;
    case "minimal":
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;text-align:center;padding:60px;border:3px solid ${settings.primaryColor};page-break-after:always;">
        ${logo ? `<div style="margin-bottom:32px;">${logo}</div>` : ""}
        <h1 style="font-size:32px;font-family:${settings.headerFont};color:${settings.primaryColor};margin-bottom:12px;">${title}</h1>
        <div style="width:64px;height:2px;background:${settings.primaryColor};margin:16px auto;"></div>
        <p style="font-size:18px;color:${settings.secondaryColor};opacity:0.8;">${subtitle}</p>
        <p style="font-size:14px;color:${settings.secondaryColor};opacity:0.6;margin-top:16px;">${date}</p>
      </div>`;
    case "full-bleed":
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:600px;background:linear-gradient(135deg,${settings.primaryColor},${settings.secondaryColor});color:#fff;padding:60px;text-align:center;position:relative;page-break-after:always;">
        ${logo ? `<div style="position:absolute;top:32px;left:32px;">${logo}</div>` : ""}
        <h1 style="font-size:40px;font-family:${settings.headerFont};margin-bottom:16px;">${title}</h1>
        <p style="font-size:20px;opacity:0.9;margin-bottom:8px;">${subtitle}</p>
        <p style="font-size:14px;opacity:0.7;">${date}</p>
      </div>`;
    default:
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;background:${settings.primaryColor};color:#fff;text-align:center;padding:60px;page-break-after:always;">
        ${logo ? `<div style="margin-bottom:24px;">${logo}</div>` : ""}
        <h1 style="font-size:36px;font-family:${settings.headerFont};margin-bottom:16px;">${title}</h1>
        <p style="font-size:20px;opacity:0.9;margin-bottom:24px;">${subtitle}</p>
        <p style="font-size:14px;opacity:0.7;">${date}</p>
      </div>`;
  }
}

function renderHeadingHtml(block: ContentBlock, settings: DesignSettings, sectionNumber?: string): string {
  const c = block.content;
  const lvl = Number(c.level) || 2;
  const prefix = sectionNumber ? `${sectionNumber} ` : '';
  const text = escapeHtml(prefix + String(c.text || ""));
  const sizes: Record<number, string> = { 1: "28px", 2: "22px", 3: "18px" };
  const headerStyle = settings.headerStyle || "accent-bar";

  let style = `font-family:${settings.headerFont};font-size:${sizes[lvl] || "22px"};margin-top:24px;color:${settings.primaryColor};`;

  switch (headerStyle) {
    case "bold": style += "font-weight:800;"; break;
    case "underline": style += `font-weight:700;border-bottom:3px solid ${settings.primaryColor};padding-bottom:8px;`; break;
    case "accent-bar": style += `font-weight:700;border-left:4px solid ${settings.primaryColor};padding-left:12px;`; break;
    case "gradient": style += `font-weight:700;background:linear-gradient(135deg,${settings.primaryColor},${settings.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;`; break;
    case "minimal": default: style += "font-weight:600;"; break;
  }

  return `<h${lvl} style="${style}">${text}</h${lvl}>`;
}

function renderBlockToHtml(block: ContentBlock, allBlocks: ContentBlock[], settings: DesignSettings, sectionMap: Record<string, string>): string {
  const c = block.content;
  switch (block.type) {
    case "cover":
      return renderCoverHtml(block, settings);

    case "toc": {
      const headings = allBlocks
        .filter((b) => b.type === "heading")
        .map((b) => {
          const num = sectionMap[b.id];
          const prefix = num ? `${num}. ` : '';
          return `<li style="margin:6px 0;"><span style="color:${settings.primaryColor};font-weight:600;">${prefix}</span>${escapeHtml(String(b.content.text || ""))}</li>`;
        });
      return `<div style="padding:40px 0;page-break-after:always;">
        <h2 style="font-family:${settings.headerFont};color:${settings.primaryColor};margin-bottom:16px;">Table of Contents</h2>
        <ul style="list-style:none;padding:0;">${headings.join("")}</ul>
      </div>`;
    }

    case "heading":
      return renderHeadingHtml(block, settings, sectionMap[block.id]);

    case "text":
      return `<div style="font-family:${settings.bodyFont};line-height:1.7;font-size:14px;">${markdownToHtml(String(c.text || ""), settings)}</div>`;

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

    case "divider": {
      const isPageBreak = (c.isPageBreak as boolean) ?? true;
      return `<hr style="border:none;border-top:1px solid ${settings.primaryColor}30;margin:32px 0;${isPageBreak ? 'page-break-after:always;' : ''}" />`;
    }

    case "quote":
      return `<blockquote style="border-left:4px solid ${settings.primaryColor};padding-left:16px;margin:16px 0;font-style:italic;color:${settings.secondaryColor};">${markdownToHtml(String(c.text || ""))}</blockquote>`;

    case "callout": {
      const variant = String(c.variant || "info");
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
        warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
        success: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
      };
      const v = colors[variant] || colors.info;
      return `<div style="background:${v.bg};border-left:4px solid ${v.border};padding:16px;border-radius:8px;margin:16px 0;color:${v.text};font-size:14px;">${markdownToHtml(String(c.text || ""))}</div>`;
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.user.id;

    const { designId } = await req.json();
    if (!designId) {
      return new Response(JSON.stringify({ error: "Missing designId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: design, error: designErr } = await adminClient
      .from("proposal_designs")
      .select("*")
      .eq("id", designId)
      .single();

    if (designErr || !design) {
      return new Response(JSON.stringify({ error: "Design not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    // Resolve logo storage path to signed URL if needed
    if (settings.logoUrl && !settings.logoUrl.startsWith('http')) {
      const { data: signedData } = await adminClient.storage
        .from('rfp-files')
        .createSignedUrl(settings.logoUrl, 3600);
      if (signedData?.signedUrl) {
        settings.logoUrl = signedData.signedUrl;
      }
    }

    const blocks = (design.content_blocks as ContentBlock[]) || [];
    const sectionMap = settings.sectionNumbering ? computeSectionNumbers(blocks) : {};
    const marginPx: Record<string, string> = { narrow: "24px", normal: "48px", wide: "72px" };

    const bodyHtml = blocks.map((b) => renderBlockToHtml(b, blocks, settings, sectionMap)).join("\n");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Proposal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Georgia&family=Merriweather:wght@400;700&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${settings.bodyFont}, sans-serif; color: #1a1a1a; padding: ${marginPx[settings.margins] || "48px"}; }
    @media print {
      body { padding: ${marginPx[settings.margins] || "48px"}; }
      @page { margin: 0; size: letter; }
    }
    img { max-width: 100%; }
    h1, h2, h3 { font-family: ${settings.headerFont}, sans-serif; }
    p { margin: 8px 0; }
    ul, ol { padding-left: 20px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

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
