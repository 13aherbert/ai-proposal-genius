import { useEffect } from "react";

const CANONICAL_BASE = "https://optirfp.ai";
const DEFAULT_OG_IMAGE = "/og-image.png";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: Record<string, unknown>;
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
}: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    setMetaTag("description", description);

    const canonicalUrl = canonical || `${CANONICAL_BASE}${window.location.pathname}`;
    setLinkTag("canonical", canonicalUrl);

    // OG tags
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    setMetaTag("og:url", canonicalUrl, "property");
    setMetaTag("og:image", ogImage.startsWith("http") ? ogImage : `${CANONICAL_BASE}${ogImage}`, "property");
    setMetaTag("og:type", ogType, "property");

    // Twitter card
    setMetaTag("twitter:card", "summary_large_image", "name");
    setMetaTag("twitter:title", title, "name");
    setMetaTag("twitter:description", description, "name");

    // Structured data
    let scriptEl: HTMLScriptElement | null = null;
    if (structuredData) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      if (scriptEl) scriptEl.remove();
    };
  }, [title, description, canonical, ogImage, ogType, structuredData]);
}
