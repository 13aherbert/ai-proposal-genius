import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blog-posts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Mail } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/navigation/Footer";

const categories = ["All", "RFP Tips", "AI", "Sales"] as const;

const Blog = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.title = "Blog — RFP Insights & Best Practices | OptiRFP";
  }, []);

  const filtered = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thanks for subscribing! You'll receive weekly tips.");
    setEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            RFP Insights &amp; Best Practices
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Expert advice on winning proposals, leveraging AI, and growing your
            business through government and enterprise contracting.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Tabs value={category} onValueChange={setCategory} className="w-full sm:w-auto">
            <TabsList>
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No articles found. Try a different search or category.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden h-full transition-shadow hover:shadow-lg">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <CardContent className="p-5 flex flex-col gap-3">
                    <Badge variant="secondary" className="w-fit text-xs">
                      {post.category}
                    </Badge>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-2">
                      <span>{post.author.name}</span>
                      <span>·</span>
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Email Capture */}
        <section className="mt-16 mb-8 rounded-lg border bg-muted/40 p-8 text-center max-w-2xl mx-auto">
          <Mail className="mx-auto h-8 w-8 text-primary mb-3" />
          <h2 className="text-2xl font-semibold mb-2">Subscribe for Weekly Tips</h2>
          <p className="text-muted-foreground mb-5">
            Get the latest RFP strategies, AI insights, and proposal best
            practices delivered to your inbox every week.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
