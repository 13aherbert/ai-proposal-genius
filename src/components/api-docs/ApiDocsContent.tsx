
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, Key, Globe, Shield, Zap, BookOpen, Code2 } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://bmopbbkfxkgzlbmhhgox.supabase.co/functions/v1/public-api";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground border">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-brand-green" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  POST: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
};

interface Endpoint {
  method: string;
  path: string;
  permission: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  example: string;
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/projects",
    permission: "projects:read",
    description: "List all projects in your organization with pagination.",
    params: [
      { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
      { name: "per_page", type: "integer", required: false, description: "Items per page (default: 50, max: 100)" },
    ],
    example: `curl -X GET "${BASE_URL}/projects?page=1&per_page=10" \\
  -H "Authorization: Bearer oak_your_api_key_here"`,
    response: `{
  "data": [
    {
      "project_id": "uuid",
      "title": "Website Redesign RFP",
      "status": "in_progress",
      "created_at": "2026-03-01T12:00:00Z",
      "updated_at": "2026-03-05T08:30:00Z"
    }
  ],
  "meta": { "total": 25, "page": 1, "per_page": 10 }
}`,
  },
  {
    method: "POST",
    path: "/projects",
    permission: "projects:create",
    description: "Create a new project in your organization.",
    body: [
      { name: "title", type: "string", required: true, description: "Project title (max 500 characters)" },
      { name: "rfp_file_path", type: "string", required: true, description: "Path to the uploaded RFP file" },
    ],
    example: `curl -X POST "${BASE_URL}/projects" \\
  -H "Authorization: Bearer oak_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "New RFP Project", "rfp_file_path": "rfps/document.pdf"}'`,
    response: `{
  "data": {
    "project_id": "uuid",
    "title": "New RFP Project",
    "status": "new",
    "created_at": "2026-03-05T10:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/projects/:id",
    permission: "projects:read",
    description: "Retrieve a single project by its ID.",
    example: `curl -X GET "${BASE_URL}/projects/your-project-id" \\
  -H "Authorization: Bearer oak_your_api_key_here"`,
    response: `{
  "data": {
    "project_id": "uuid",
    "title": "Website Redesign RFP",
    "status": "in_progress",
    "analysis": "...",
    "proposal_outline": "...",
    "created_at": "2026-03-01T12:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/projects/:id/sections",
    permission: "proposals:read",
    description: "List all proposal sections for a specific project.",
    example: `curl -X GET "${BASE_URL}/projects/your-project-id/sections" \\
  -H "Authorization: Bearer oak_your_api_key_here"`,
    response: `{
  "data": [
    {
      "section_id": "uuid",
      "section_title": "Executive Summary",
      "content": "...",
      "created_at": "2026-03-02T14:00:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "per_page": 50 }
}`,
  },
  {
    method: "GET",
    path: "/knowledge-base",
    permission: "knowledge_base:read",
    description: "List all knowledge base entries in your organization.",
    params: [
      { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
      { name: "per_page", type: "integer", required: false, description: "Items per page (default: 50, max: 100)" },
    ],
    example: `curl -X GET "${BASE_URL}/knowledge-base?page=1&per_page=20" \\
  -H "Authorization: Bearer oak_your_api_key_here"`,
    response: `{
  "data": [
    {
      "entry_id": "uuid",
      "title": "Company Overview",
      "category": "general",
      "created_at": "2026-02-15T09:00:00Z"
    }
  ],
  "meta": { "total": 12, "page": 1, "per_page": 20 }
}`,
  },
  {
    method: "POST",
    path: "/knowledge-base",
    permission: "knowledge_base:create",
    description: "Create a new knowledge base entry.",
    body: [
      { name: "title", type: "string", required: true, description: "Entry title (max 500 characters)" },
      { name: "content", type: "string", required: true, description: "Entry content (max 50,000 characters)" },
      { name: "category", type: "string", required: false, description: 'Category (default: "general")' },
    ],
    example: `curl -X POST "${BASE_URL}/knowledge-base" \\
  -H "Authorization: Bearer oak_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Past Performance", "content": "Our team has...", "category": "experience"}'`,
    response: `{
  "data": {
    "entry_id": "uuid",
    "title": "Past Performance",
    "category": "experience",
    "created_at": "2026-03-05T10:30:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/knowledge-base/:id",
    permission: "knowledge_base:read",
    description: "Retrieve a single knowledge base entry by its ID.",
    example: `curl -X GET "${BASE_URL}/knowledge-base/your-entry-id" \\
  -H "Authorization: Bearer oak_your_api_key_here"`,
    response: `{
  "data": {
    "entry_id": "uuid",
    "title": "Company Overview",
    "category": "general",
    "content": "Full content of the entry...",
    "created_at": "2026-02-15T09:00:00Z"
  }
}`,
  },
];

const ERROR_CODES = [
  { code: "UNAUTHORIZED", status: 401, description: "Missing or invalid API key." },
  { code: "FORBIDDEN", status: 403, description: "Valid key but insufficient permissions or inactive subscription." },
  { code: "NOT_FOUND", status: 404, description: "The requested resource does not exist within your organization." },
  { code: "VALIDATION_ERROR", status: 400, description: "Request body failed validation (missing required fields, exceeded limits)." },
  { code: "RATE_LIMITED", status: 429, description: "Too many requests. Check the Retry-After header." },
  { code: "INTERNAL_ERROR", status: 500, description: "An unexpected server error occurred. Contact support if it persists." },
];

export function ApiDocsContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Programmatic access to your organization's projects, proposals, and knowledge base.
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Start
          </CardTitle>
          <CardDescription>Get up and running in under a minute.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-sm text-foreground">
            <li>
              Generate an API key from your{" "}
              <Link to="/organization" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Organization Settings → API tab
              </Link>
              .
            </li>
            <li>
              Include the key in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header of every request.
            </li>
            <li>Make your first API call:</li>
          </ol>
          <CodeBlock
            code={`curl -X GET "${BASE_URL}/projects" \\
  -H "Authorization: Bearer oak_your_api_key_here"`}
          />
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All requests must include an API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header using the Bearer scheme.
          </p>
          <CodeBlock code={`Authorization: Bearer oak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">Key Format</p>
              <p className="text-xs text-muted-foreground">
                Keys are prefixed with <code className="bg-muted px-1 py-0.5 rounded font-mono">oak_</code> followed by 64 characters.
              </p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium text-foreground">Key Management</p>
              <p className="text-xs text-muted-foreground">
                Create, rotate, and revoke keys from the{" "}
                <Link to="/organization" className="text-primary underline underline-offset-4">
                  Organization → API tab
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Base URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock code={BASE_URL} />
          <p className="text-xs text-muted-foreground mt-2">
            All endpoint paths are relative to this base URL.
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Endpoints
          </CardTitle>
          <CardDescription>7 endpoints across Projects, Proposals, and Knowledge Base.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4 mt-4">
              {ENDPOINTS.filter((e) => e.path.startsWith("/projects") && !e.path.includes("sections")).map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
              ))}
            </TabsContent>

            <TabsContent value="proposals" className="space-y-4 mt-4">
              {ENDPOINTS.filter((e) => e.path.includes("sections")).map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
              ))}
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-4 mt-4">
              {ENDPOINTS.filter((e) => e.path.startsWith("/knowledge")).map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle>Response Format</CardTitle>
          <CardDescription>All responses follow a consistent JSON structure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Success Response</p>
            <CodeBlock
              language="json"
              code={`{
  "data": { ... },
  "meta": {
    "total": 25,
    "page": 1,
    "per_page": 50
  }
}`}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Error Response</p>
            <CodeBlock
              language="json"
              code={`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Error Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-foreground">Code</th>
                  <th className="text-left p-3 font-medium text-foreground">HTTP Status</th>
                  <th className="text-left p-3 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_CODES.map((err) => (
                  <tr key={err.code} className="border-b last:border-b-0">
                    <td className="p-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{err.code}</code>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{err.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{err.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            API requests are rate-limited to <strong className="text-foreground">100 requests per minute</strong> per API key by default. This limit can be customized per key by your organization admin.
          </p>
          <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
            <p className="text-sm font-medium text-foreground">When rate limited:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>You'll receive a <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">429 Too Many Requests</code> response.</li>
              <li>Check the <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">Retry-After</code> header for the number of seconds to wait.</li>
              <li>Implement exponential backoff for optimal retry behavior.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <Badge className={`${METHOD_COLORS[endpoint.method]} border font-mono text-xs`}>
              {endpoint.method}
            </Badge>
            <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              {endpoint.permission}
            </Badge>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border p-4 space-y-4">
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>

        {endpoint.params && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Query Parameters</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium text-foreground">Parameter</th>
                    <th className="text-left p-2 font-medium text-foreground">Type</th>
                    <th className="text-left p-2 font-medium text-foreground">Required</th>
                    <th className="text-left p-2 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p) => (
                    <tr key={p.name} className="border-b last:border-b-0">
                      <td className="p-2"><code className="text-xs font-mono">{p.name}</code></td>
                      <td className="p-2 text-muted-foreground">{p.type}</td>
                      <td className="p-2">{p.required ? <Badge variant="destructive" className="text-xs">Required</Badge> : <span className="text-muted-foreground text-xs">Optional</span>}</td>
                      <td className="p-2 text-muted-foreground">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {endpoint.body && (
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Request Body</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium text-foreground">Field</th>
                    <th className="text-left p-2 font-medium text-foreground">Type</th>
                    <th className="text-left p-2 font-medium text-foreground">Required</th>
                    <th className="text-left p-2 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.body.map((b) => (
                    <tr key={b.name} className="border-b last:border-b-0">
                      <td className="p-2"><code className="text-xs font-mono">{b.name}</code></td>
                      <td className="p-2 text-muted-foreground">{b.type}</td>
                      <td className="p-2">{b.required ? <Badge variant="destructive" className="text-xs">Required</Badge> : <span className="text-muted-foreground text-xs">Optional</span>}</td>
                      <td className="p-2 text-muted-foreground">{b.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Example Request</p>
          <CodeBlock code={endpoint.example} />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">Example Response</p>
          <CodeBlock code={endpoint.response} language="json" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
