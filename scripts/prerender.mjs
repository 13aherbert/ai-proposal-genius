#!/usr/bin/env node
/**
 * Build-time prerender for per-route SEO metadata.
 *
 * Runs after `vite build` via the `postbuild` script:
 *   1. Reads every <loc> from public/sitemap.xml and derives its path.
 *   2. Adds dynamic routes we know about (blog post slugs, template slugs).
 *   3. Spins up `vite preview` on port 4173.
 *   4. For each route, uses Playwright (Chromium, headless) to load the page,
 *      waits for useSEO to set `data-seo-ready="1"` on <html>, then snapshots
 *      the fully-rendered outerHTML.
 *   5. Writes the snapshot to `dist/<route>/index.html`.
 *
 * Netlify serves the static file first, so crawlers and View Source see the
 * correct per-page <title>, <meta description>, canonical, and og:* tags.
 * Real users still hydrate the SPA normally.
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const PORT = 4173;
const ORIGIN = `http://localhost:${PORT}`;
const TIMEOUT_MS = 20_000;

if (!existsSync(DIST)) {
  console.error("[prerender] dist/ not found — run `vite build` first.");
  process.exit(1);
}

// ── Load Playwright (soft dependency: skip prerender if unavailable) ────────
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (err) {
  console.warn("[prerender] playwright not installed — skipping prerender.");
  console.warn("[prerender]", err?.message ?? err);
  process.exit(0);
}

// ── Collect routes ───────────────────────────────────────────────────────────
const routes = new Set(["/"]);

// 1. sitemap.xml
const sitemap = readFileSync(join(ROOT, "public/sitemap.xml"), "utf8");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  try {
    const url = new URL(match[1]);
    routes.add(url.pathname || "/");
  } catch {
    /* ignore malformed */
  }
}

// 2. Blog post slugs — parse without importing TS
try {
  const blog = readFileSync(join(ROOT, "src/data/blog-posts.ts"), "utf8");
  for (const m of blog.matchAll(/slug:\s*["']([^"']+)["']/g)) {
    routes.add(`/blog/${m[1]}`);
  }
} catch {
  /* ignore */
}

// 3. Template slugs
try {
  const templates = readFileSync(join(ROOT, "src/data/rfp-templates.ts"), "utf8");
  for (const m of templates.matchAll(/slug:\s*["']([^"']+)["']/g)) {
    routes.add(`/tools/rfp-template-library/${m[1]}`);
  }
} catch {
  /* ignore */
}

const routeList = [...routes];
console.log(`[prerender] ${routeList.length} routes to snapshot.`);

// ── Start vite preview ───────────────────────────────────────────────────────
const preview = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort"],
  { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
);

preview.stdout.on("data", (d) => process.stdout.write(`[preview] ${d}`));
preview.stderr.on("data", (d) => process.stderr.write(`[preview] ${d}`));

async function waitForPort(port, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((res) => {
      const s = net.createConnection(port, "127.0.0.1");
      s.once("connect", () => { s.end(); res(true); });
      s.once("error", () => res(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`vite preview did not open port ${port} within ${timeoutMs}ms`);
}

function shutdown() {
  try { preview.kill("SIGTERM"); } catch { /* ignore */ }
}
process.on("exit", shutdown);
process.on("SIGINT", () => { shutdown(); process.exit(130); });

try {
  await waitForPort(PORT);
} catch (err) {
  console.error("[prerender]", err.message);
  shutdown();
  process.exit(1);
}

// ── Snapshot each route ──────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

let ok = 0;
let failed = 0;

for (const route of routeList) {
  const page = await context.newPage();
  try {
    await page.goto(`${ORIGIN}${route}`, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
    // Wait for useSEO to run. Home may not call useSEO — fall back to timeout.
    await page
      .waitForFunction(() => document.documentElement.dataset.seoReady === "1", { timeout: 5_000 })
      .catch(() => { /* leave whatever's in the DOM */ });

    // Empty out #root in the live DOM (using the parser, not regex) so React
    // mounts cleanly with no duplicated/orphan content in <body>.
    const html = await page.evaluate(() => {
      const root = document.getElementById("root");
      if (root) root.innerHTML = "";
      return "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    });

    const outDir = route === "/" ? DIST : join(DIST, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html, "utf8");
    ok++;
    console.log(`  ✓ ${route}`);
  } catch (err) {
    failed++;
    console.warn(`  ✗ ${route} — ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
shutdown();

console.log(`[prerender] done. ${ok} written, ${failed} failed.`);
process.exit(0);
