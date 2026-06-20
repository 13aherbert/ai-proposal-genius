import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Send, Loader2, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BlogPostData } from "@/hooks/use-blog-posts";
import { submitToIndexNow } from "@/utils/indexnow";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["RFP Tips", "AI", "Sales"] as const;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface BlogPostEditorProps {
  post?: BlogPostData | null;
  onSaved?: () => void;
}

export default function BlogPostEditor({ post, onSaved }: BlogPostEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [category, setCategory] = useState(post?.category || "RFP Tips");
  const [content, setContent] = useState(post?.content || "");
  const [imageUrl, setImageUrl] = useState(post?.image_url || "");
  const [authorName, setAuthorName] = useState(post?.author_name || "");
  const [authorRole, setAuthorRole] = useState(post?.author_role || "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slugManuallyEdited && !isEditing) {
      setSlug(generateSlug(title));
    }
  }, [title, slugManuallyEdited, isEditing]);

  const validate = useCallback(() => {
    if (!title.trim()) { toast.error("Title is required"); return false; }
    if (!slug.trim()) { toast.error("Slug is required"); return false; }
    if (!excerpt.trim()) { toast.error("Excerpt is required"); return false; }
    if (!content.trim()) { toast.error("Content is required"); return false; }
    if (!authorName.trim()) { toast.error("Author name is required"); return false; }
    return true;
  }, [title, slug, excerpt, content, authorName]);

  const save = async (status: "draft" | "published") => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        category,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        author_name: authorName.trim(),
        author_role: authorRole.trim() || null,
        status,
        published_at: status === "published" ? (post?.published_at || new Date().toISOString()) : null,
      };

      if (isEditing && post) {
        const { error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }

      toast.success(status === "published" ? "Post published!" : "Draft saved!");
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      if (status === "published") {
        submitToIndexNow(`https://optirfp.ai/blog/${slug.trim()}`);
      }
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => onSaved ? onSaved() : navigate("/admin/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save("draft")} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => save("published")} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
              placeholder="post-slug"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief description..." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Content (Markdown)</Label>
            <Tabs defaultValue="write">
              <TabsList>
                <TabsTrigger value="write"><Edit className="mr-1 h-3 w-3" />Write</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="mr-1 h-3 w-3" />Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your blog post content in Markdown..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <Card>
                  <CardContent className="pt-6">
                    <article className="prose prose-lg dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content || "*No content yet*"}
                      </ReactMarkdown>
                    </article>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Cover Image URL</Label>
                <Input id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                {imageUrl && (
                  <img src={imageUrl} alt="Blog post cover preview" className="w-full h-32 object-cover rounded-md mt-2" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input id="authorName" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Author name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorRole">Author Role</Label>
                <Input id="authorRole" value={authorRole} onChange={e => setAuthorRole(e.target.value)} placeholder="e.g. Content Strategist" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
