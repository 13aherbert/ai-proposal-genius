import { useEffect } from "react";
import { analytics } from "@/services/analytics";
import { seoTracking } from "@/lib/analytics-dedupe";


const CANONICAL_BASE = "https://optirfp.ai";
const DEFAULT_OG_IMAGE = "https://optirfp.ai/og-image.png";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: Record<string, unknown>;
  /** Set true on authenticated/app pages to keep them out of search indexes. */
  noindex?: boolean;
}

function setMetaTag(name: string, content: string, attribute = "name") {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (tag) {
    tag.setAttribute("content", content);
  } else {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    tag.content = content;
    document.head.appendChild(tag);
  }
}

function setLinkTag(rel: string, href: string) {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (tag) {
    tag.href = href;
  } else {
    tag = document.createElement("link");
    tag.rel = rel;
    tag.href = href;
    document.head.appendChild(tag);
  }
}

export function useSEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  structuredData,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    setMetaTag("description", description);

    const canonicalUrl = canonical || `${CANONICAL_BASE}${window.location.pathname}`;
    setLinkTag("canonical", canonicalUrl);

    // Robots directive (private/app pages set noindex)
    setMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");

    // OG tags
    const resolvedImage = ogImage.startsWith("http") ? ogImage : `${CANONICAL_BASE}${ogImage}`;
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    setMetaTag("og:url", canonicalUrl, "property");
    setMetaTag("og:image", resolvedImage, "property");
    setMetaTag("og:type", ogType, "property");
    setMetaTag("og:site_name", "OptiRFP", "property");

    // Twitter card
    setMetaTag("twitter:card", "summary_large_image", "name");
    setMetaTag("twitter:title", title, "name");
    setMetaTag("twitter:description", description, "name");
    setMetaTag("twitter:image", resolvedImage, "name");

    // Structured data
    let scriptEl: HTMLScriptElement | null = null;
    if (structuredData) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptEl);
    }

    // Fire GA4 pageview NOW that <title> and canonical are correct.
    // This replaces the route-change tracker in useAnalytics, which fired
    // before lazy-loaded pages had mounted and set their real title.
    const path = window.location.pathname + window.location.search;
    seoTracking.lastTrackedPath = path;
    analytics.trackPageView(path, title);

    // Signal for the build-time prerender script (scripts/prerender.mjs)
    // that the per-route SEO tags have been written into the DOM.
    document.documentElement.dataset.seoReady = "1";

    return () => {
      document.title = prevTitle;
      if (scriptEl) scriptEl.remove();
    };

  }, [title, description, canonical, ogImage, ogType, structuredData, noindex]);
}
