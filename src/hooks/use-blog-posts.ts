import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  image_url: string | null;
  author_name: string;
  author_role: string | null;
  status: string;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function usePublishedBlogPosts() {
  return useQuery({
    queryKey: ["blog-posts", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as BlogPostData[];
    },
  });
}

export function useBlogPostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog-posts", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      return data as BlogPostData | null;
    },
    enabled: !!slug,
  });
}

export function useRelatedPosts(currentSlug: string | undefined, category: string | undefined, count = 3) {
  return useQuery({
    queryKey: ["blog-posts", "related", currentSlug, category],
    queryFn: async () => {
      if (!currentSlug) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .neq("slug", currentSlug)
        .order("published_at", { ascending: false })
        .limit(count);

      if (error) throw error;
      // Sort: same category first
      const posts = data as BlogPostData[];
      if (category) {
        posts.sort((a, b) => {
          if (a.category === category && b.category !== category) return -1;
          if (b.category === category && a.category !== category) return 1;
          return 0;
        });
      }
      return posts.slice(0, count);
    },
    enabled: !!currentSlug,
  });
}

// Admin hook: fetches ALL posts (drafts + published)
export function useAllBlogPosts() {
  return useQuery({
    queryKey: ["blog-posts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as BlogPostData[];
    },
  });
}
