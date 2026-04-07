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

/**
 * Detect whether a string is already HTML (from TipTap rich-text editor).
 * If so, return it as-is with only sanitisation of dangerous tags.
 * If not, convert markdown to HTML.
 */
function isHtmlContent(text: string): boolean {
  return /<(?:p|h[1-6]|ul|ol|li|table|blockquote|strong|em|br|div|span)\b/i.test(text);
}

/**
 * Sanitise HTML from TipTap — strip <script> tags but keep formatting.
 * Also add print-friendly styles to tables.
 */
function sanitiseRichHtml(html: string, settings?: { primaryColor: string }): string {
  let sanitised = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

  // Style tables for export
  if (settings) {
    sanitised = sanitised.replace(/<table(?:\s[^>]*)?>/gi, (match) => {
      if (match.includes('style=')) return match;
      return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">`;
    });
    sanitised = sanitised.replace(/<th(?:\s[^>]*)?>/gi, () =>
      `<th style="padding:8px 12px;text-align:left;font-weight:600;background:${settings.primaryColor};color:#fff;border:1px solid #e2e8f0;">`
    );
    sanitised = sanitised.replace(/<td(?:\s[^>]*)?>/gi, () =>
      `<td style="padding:8px 12px;border:1px solid #e2e8f0;">`
    );
  }

  // Style blockquotes
  if (settings) {
    sanitised = sanitised.replace(/<blockquote(?:\s[^>]*)?>/gi, () =>
      `<blockquote style="border-left:4px solid ${settings.primaryColor};padding-left:16px;margin:16px 0;font-style:italic;color:#555;">`
    );
  }

  // Style links
  sanitised = sanitised.replace(/<a\s/gi, '<a style="color:#3b82f6;text-decoration:underline;" ');

  // Add styles to lists
  sanitised = sanitised.replace(/<ul(?:\s[^>]*)?>/gi, '<ul style="padding-left:20px;margin:8px 0;">');
  sanitised = sanitised.replace(/<ol(?:\s[^>]*)?>/gi, '<ol style="padding-left:20px;margin:8px 0;">');

  return sanitised;
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
  html = html.replace(/~~(.*?)~~/g, "<s>$1</s>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;text-decoration:underline;">$1</a>');
  html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, "<oli>$1</oli>");
  html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (match) => `<ol style="padding-left:20px;">${match.replace(/<\/?oli>/g, (t) => t === '<oli>' ? '<li>' : '</li>')}</ol>`);
  // Unordered lists
  html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul style='padding-left:20px;'>$&</ul>");
  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gm, "<blockquote style='border-left:4px solid #ccc;padding-left:16px;margin:8px 0;font-style:italic;color:#555;'>$1</blockquote>");
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><(h[1234]|ul|ol|li|blockquote)/g, "<$1");
  html = html.replace(/<\/(h[1234]|ul|ol|li|blockquote)><\/p>/g, "</$1>");

  tables.forEach((table, i) => {
    html = html.replace(`__TABLE_PLACEHOLDER_${i}__`, table);
  });
  return html;
}

/**
 * Process text content: if it's already HTML (from TipTap), sanitise and pass through.
 * If it's markdown (legacy), convert to HTML.
 */
function processTextContent(text: string, settings?: { primaryColor: string }): string {
  if (!text) return '';
  if (isHtmlContent(text)) {
    return sanitiseRichHtml(text, settings);
  }
  return markdownToHtml(text, settings);
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
  const coverImageUrl = c.coverImageUrl ? escapeHtml(String(c.coverImageUrl)) : "";
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
    case "banner":
      return `<div style="min-height:600px;page-break-after:always;">
        <div style="height:350px;background:${coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : `linear-gradient(135deg,${settings.primaryColor},${settings.secondaryColor})`};"></div>
        <div style="background:${settings.primaryColor};color:#fff;padding:32px 48px;">
          ${logo ? `<div style="margin-bottom:12px;">${logo}</div>` : ""}
          <h1 style="font-size:32px;font-family:${settings.headerFont};margin-bottom:8px;">${title}</h1>
          <p style="font-size:16px;opacity:0.9;margin-bottom:4px;">${subtitle}</p>
          <p style="font-size:14px;opacity:0.7;">${date}</p>
        </div>
      </div>`;
    case "sidebar":
      return `<div style="display:flex;min-height:600px;page-break-after:always;">
        <div style="width:30%;background:${settings.primaryColor};color:#fff;padding:32px;display:flex;flex-direction:column;justify-content:space-between;">
          ${logo ? `<div>${logo}</div>` : "<div></div>"}
          <div>
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;">Date</p>
            <p style="font-size:13px;margin-bottom:16px;">${date}</p>
            <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.7;">Prepared by</p>
            <p style="font-size:13px;">${subtitle}</p>
          </div>
        </div>
        <div style="width:70%;padding:60px;display:flex;flex-direction:column;justify-content:center;">
          <h1 style="font-size:36px;font-family:${settings.headerFont};color:${settings.primaryColor};margin-bottom:16px;">${title}</h1>
          <p style="font-size:18px;color:${settings.secondaryColor};">${subtitle}</p>
        </div>
      </div>`;
    case "diagonal":
      return `<div style="position:relative;min-height:600px;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;page-break-after:always;">
        <div style="position:absolute;inset:0;background:${settings.primaryColor};"></div>
        <div style="position:absolute;inset:0;background:${settings.secondaryColor};clip-path:polygon(100% 0, 0% 100%, 100% 100%);"></div>
        <div style="position:relative;z-index:1;color:#fff;padding:60px;">
          ${logo ? `<div style="margin-bottom:24px;">${logo}</div>` : ""}
          <h1 style="font-size:40px;font-family:${settings.headerFont};margin-bottom:16px;">${title}</h1>
          <p style="font-size:20px;opacity:0.9;margin-bottom:8px;">${subtitle}</p>
          <p style="font-size:14px;opacity:0.7;">${date}</p>
        </div>
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
  const sizes: Record<number, string> = { 1: "28px", 2: "22px", 3: "18px", 4: "16px" };
  const headerStyle = settings.headerStyle || "accent-bar";

  let style = `font-family:${settings.headerFont};font-size:${sizes[lvl] || "22px"};margin-top:24px;color:${settings.primaryColor};`;

  switch (headerStyle) {
    case "bold": style += "font-weight:800;"; break;
    case "underline": style += `font-weight:700;border-bottom:3px solid ${settings.primaryColor};padding-bottom:8px;`; break;
    case "accent-bar": style += `font-weight:700;border-left:4px solid ${settings.primaryColor};padding-left:12px;`; break;
    case "gradient": style += `font-weight:700;background:linear-gradient(135deg,${settings.primaryColor},${settings.secondaryColor});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;`; break;
    case "boxed": style = `font-family:${settings.headerFont};font-size:${sizes[lvl] || "22px"};margin-top:24px;font-weight:700;background:${settings.primaryColor};color:#fff;padding:8px 16px;border-radius:4px;`; break;
    case "pill": style = `font-family:${settings.headerFont};font-size:${sizes[lvl] || "22px"};margin-top:24px;font-weight:700;background:${settings.primaryColor};color:#fff;padding:6px 24px;border-radius:9999px;display:inline-block;`; break;
    case "numbered":
      if (sectionNumber) {
        return `<div style="display:flex;align-items:center;gap:12px;border-bottom:2px solid ${settings.primaryColor};padding-bottom:8px;margin-top:24px;">
          <span style="background:${settings.primaryColor};color:#fff;font-weight:700;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:14px;">${escapeHtml(sectionNumber)}</span>
          <h${lvl} style="font-family:${settings.headerFont};font-size:${sizes[lvl] || "22px"};color:${settings.primaryColor};font-weight:700;margin:0;">${escapeHtml(String(c.text || ""))}</h${lvl}>
        </div>`;
      }
      style += `font-weight:700;border-bottom:2px solid ${settings.primaryColor};padding-bottom:8px;`; break;
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
      return `<div style="font-family:${settings.bodyFont};line-height:1.7;font-size:14px;">${processTextContent(String(c.text || ""), settings)}</div>`;

    case "image":
      return `<figure style="text-align:center;margin:24px 0;">
        ${c.url ? `<img src="${escapeHtml(String(c.url))}" style="max-width:100%;border-radius:8px;" />` : ""}
        ${c.caption ? `<figcaption style="font-size:12px;color:#666;margin-top:8px;">${escapeHtml(String(c.caption))}</figcaption>` : ""}
      </figure>`;

    case "table": {
      const headers = (c.headers as string[]) || [];
      const rows = (c.rows as string[][]) || [];
      return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
        <thead><tr style="background:${settings.primaryColor};color:#fff;">${headers.map((h) => `<th style="padding:8px 12px;text-align:left;border:1px solid #e2e8f0;">${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row, i) => `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">${row.map((cell) => `<td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
    }

    case "divider": {
      const isPageBreak = (c.isPageBreak as boolean) ?? true;
      return `<hr style="border:none;border-top:1px solid ${settings.primaryColor}30;margin:32px 0;${isPageBreak ? 'page-break-after:always;' : ''}" />`;
    }

    case "quote":
      return `<blockquote style="border-left:4px solid ${settings.primaryColor};padding-left:16px;margin:16px 0;font-style:italic;color:${settings.secondaryColor};">${processTextContent(String(c.text || ""))}</blockquote>`;

    case "callout": {
      const variant = String(c.variant || "info");
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
        warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
        success: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
      };
      const v = colors[variant] || colors.info;
      return `<div style="background:${v.bg};border-left:4px solid ${v.border};padding:16px;border-radius:8px;margin:16px 0;color:${v.text};font-size:14px;">${processTextContent(String(c.text || ""))}</div>`;
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

    const { designId, plan } = await req.json();
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

    // Resolve cover image URLs in cover blocks
    for (const block of blocks) {
      if (block.type === 'cover' && block.content.coverImageUrl) {
        const imgPath = String(block.content.coverImageUrl);
        if (!imgPath.startsWith('http')) {
          const { data: signedData } = await adminClient.storage
            .from('rfp-files')
            .createSignedUrl(imgPath, 3600);
          if (signedData?.signedUrl) {
            block.content.coverImageUrl = signedData.signedUrl;
          }
        }
      }
      // Resolve image block URLs
      if (block.type === 'image' && block.content.url) {
        const imgPath = String(block.content.url);
        if (!imgPath.startsWith('http')) {
          const { data: signedData } = await adminClient.storage
            .from('rfp-files')
            .createSignedUrl(imgPath, 3600);
          if (signedData?.signedUrl) {
            block.content.url = signedData.signedUrl;
          }
        }
      }
    }

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
    h1, h2, h3, h4 { font-family: ${settings.headerFont}, sans-serif; }
    p { margin: 8px 0; }
    ul, ol { padding-left: 20px; }
    li { margin: 4px 0; }
    table { page-break-inside: avoid; }
    /* Rich-text content styles */
    strong { font-weight: 700; }
    em { font-style: italic; }
    u { text-decoration: underline; }
    s { text-decoration: line-through; }
    mark { background-color: #fef08a; padding: 0 2px; }
    a { color: #3b82f6; text-decoration: underline; }
    blockquote { border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 16px 0; font-style: italic; }
    .tiptap-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .tiptap-table th, .tiptap-table td { border: 1px solid #e2e8f0; padding: 8px 12px; }
  </style>
</head>
<body>
${bodyHtml}
${plan === 'starter' ? '<div style="position:fixed;bottom:0;left:0;right:0;text-align:center;padding:10px;background:rgba(248,248,248,0.95);border-top:1px solid #e0e0e0;font-size:10pt;font-style:italic;color:rgba(0,0,0,0.3);font-family:sans-serif;">Generated by OptiRFP Free — Upgrade to remove watermark</div>' : ''}
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
