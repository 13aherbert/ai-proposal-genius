import React, { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBlogPostBySlug, useRelatedPosts } from "@/hooks/use-blog-posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Share2, Twitter, Linkedin, Copy, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/navigation/Footer";
import { useSEO } from "@/hooks/use-seo";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = useBlogPostBySlug(slug);
  const { data: related = [] } = useRelatedPosts(slug, post?.category);

  const structuredData = useMemo(() => post ? ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": { "@type": "Person", "name": post.author_name },
    "datePublished": post.published_at,
    "image": post.image_url,
    "url": `https://optirfp.ai/blog/${slug}`,
  }) : undefined, [post, slug]);

  const blogDescription = post
    ? (post.excerpt && post.excerpt.length >= 60
        ? post.excerpt
        : `${post.excerpt || post.title} — insights from the OptiRFP blog on ${post.category || "RFPs, AI proposals, and winning more contracts"}.`)
    : "OptiRFP Blog — expert advice on writing winning RFPs, AI tools, and proposal best practices.";

  useSEO({
    title: post ? `${post.title} | OptiRFP Blog` : "OptiRFP Blog",
    description: blogDescription,
    ogType: "article",
    ogImage: post?.image_url,
    canonical: post ? `https://optirfp.ai/blog/${slug}` : undefined,
    structuredData,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <Button variant="outline" onClick={() => navigate("/blog")}>
          Back to Blog
        </Button>
      </div>
    );
  }

  const shareUrl = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard");
  };

  const shareTwitter = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );

  const shareLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Nav */}
        <div className="py-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/blog")} aria-label="Back to blog">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/blog">Blog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {post.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Image */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        )}

        {/* Article Header */}
        <div className="max-w-[720px] mx-auto mt-8">
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium text-foreground">{post.author_name}</span>
                {post.author_role && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{post.author_role}</span>
                  </>
                )}
              </div>
            </div>
            {post.published_at && (
              <>
                <span>·</span>
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
          </div>

          {/* Share */}
          <div className="flex items-center gap-2 mb-8 border-b pb-6">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-1">Share:</span>
            <Button variant="ghost" size="icon" onClick={copyLink} aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={shareTwitter} aria-label="Share on Twitter">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={shareLinkedIn} aria-label="Share on LinkedIn">
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none text-lg leading-[1.8]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </article>

          {/* Author Bio */}
          <div className="mt-12 p-6 rounded-lg border bg-muted/30 flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{post.author_name}</p>
              {post.author_role && <p className="text-sm text-muted-foreground">{post.author_role}</p>}
              <p className="text-sm text-muted-foreground mt-2">
                Sharing insights on proposal strategy, AI-powered workflows, and winning more contracts.
              </p>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16 mb-12">
            <h2 className="text-2xl font-semibold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <Card className="overflow-hidden h-full transition-shadow hover:shadow-lg">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.title}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    )}
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {r.category}
                      </Badge>
                      <h3 className="font-semibold group-hover:text-primary transition-colors leading-snug">
                        {r.title}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
