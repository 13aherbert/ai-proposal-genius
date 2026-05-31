import { useSEO } from "@/hooks/use-seo";

const DEFAULT_OG_IMAGE = "https://optirfp.ai/images/og-default.png";

export interface SEOProps {
  /** <title> */
  title: string;
  /** <meta name="description"> */
  description: string;
  /** Full canonical URL (https://optirfp.ai/...) */
  canonical: string;
  /** og:type — defaults to "website" */
  ogType?: string;
  /** og:image / twitter:image — defaults to brand banner */
  ogImage?: string;
  /** JSON-LD object or array of objects */
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Page-level SEO component. Renders title, description, canonical,
 * Open Graph, Twitter Card, and optional JSON-LD into document.head.
 *
 * Backed by the existing `useSEO` head manager — do NOT add
 * react-helmet-async alongside this without removing useSEO first,
 * or every tag will be emitted twice.
 */
export function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  schema,
}: SEOProps) {
  useSEO({
    title,
    description,
    canonical,
    ogType,
    ogImage,
    structuredData: Array.isArray(schema)
      ? { "@context": "https://schema.org", "@graph": schema }
      : schema,
  });
  return null;
}

export default SEO;
