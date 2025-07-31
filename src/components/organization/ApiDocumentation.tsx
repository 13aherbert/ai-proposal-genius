import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Book, 
  Copy, 
  Play, 
  Code, 
  ChevronDown,
  ChevronRight,
  Key,
  Globe,
  Terminal,
  FileText,
  Zap,
  Lock,
  CheckCircle
} from 'lucide-react';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  parameters?: ApiParameter[];
  headers?: ApiHeader[];
  body?: string;
  responses: ApiResponse[];
  authentication: 'api_key' | 'bearer' | 'none';
  rateLimit?: string;
  scope?: string[];
}

interface ApiParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  example?: any;
}

interface ApiHeader {
  name: string;
  required: boolean;
  description: string;
  example: string;
}

interface ApiResponse {
  status: number;
  description: string;
  schema?: string;
  example?: any;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/organizations/{org_id}',
    description: 'Retrieve organization details',
    parameters: [
      { name: 'org_id', type: 'string', required: true, description: 'Organization ID', example: 'org_123' }
    ],
    headers: [
      { name: 'Authorization', required: true, description: 'API key or Bearer token', example: 'Bearer your-api-key' }
    ],
    responses: [
      { 
        status: 200, 
        description: 'Organization details retrieved successfully',
        example: { id: 'org_123', name: 'My Organization', subscription_tier: 'pro' }
      },
      { status: 404, description: 'Organization not found' },
      { status: 401, description: 'Unauthorized' }
    ],
    authentication: 'api_key',
    rateLimit: '100 requests per minute',
    scope: ['org:read']
  },
  {
    method: 'GET',
    path: '/api/v1/organizations/{org_id}/projects',
    description: 'List all projects in the organization',
    parameters: [
      { name: 'org_id', type: 'string', required: true, description: 'Organization ID', example: 'org_123' },
      { name: 'limit', type: 'number', required: false, description: 'Number of results to return', example: 50 },
      { name: 'offset', type: 'number', required: false, description: 'Offset for pagination', example: 0 },
      { name: 'status', type: 'string', required: false, description: 'Filter by project status', example: 'active' }
    ],
    headers: [
      { name: 'Authorization', required: true, description: 'API key or Bearer token', example: 'Bearer your-api-key' }
    ],
    responses: [
      { 
        status: 200, 
        description: 'Projects retrieved successfully',
        example: { 
          projects: [{ id: 'proj_123', title: 'My Project', status: 'active' }],
          total: 10,
          has_more: false
        }
      },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' }
    ],
    authentication: 'api_key',
    rateLimit: '100 requests per minute',
    scope: ['projects:read']
  },
  {
    method: 'POST',
    path: '/api/v1/organizations/{org_id}/projects',
    description: 'Create a new project',
    parameters: [
      { name: 'org_id', type: 'string', required: true, description: 'Organization ID', example: 'org_123' }
    ],
    headers: [
      { name: 'Authorization', required: true, description: 'API key or Bearer token', example: 'Bearer your-api-key' },
      { name: 'Content-Type', required: true, description: 'Content type', example: 'application/json' }
    ],
    body: JSON.stringify({
      title: 'New Project',
      description: 'Project description',
      deadline: '2024-12-31T23:59:59Z'
    }, null, 2),
    responses: [
      { 
        status: 201, 
        description: 'Project created successfully',
        example: { id: 'proj_456', title: 'New Project', status: 'draft' }
      },
      { status: 400, description: 'Bad request' },
      { status: 401, description: 'Unauthorized' }
    ],
    authentication: 'api_key',
    rateLimit: '50 requests per minute',
    scope: ['projects:write']
  },
  {
    method: 'GET',
    path: '/api/v1/organizations/{org_id}/members',
    description: 'List organization members',
    parameters: [
      { name: 'org_id', type: 'string', required: true, description: 'Organization ID', example: 'org_123' },
      { name: 'role', type: 'string', required: false, description: 'Filter by member role', example: 'admin' }
    ],
    headers: [
      { name: 'Authorization', required: true, description: 'API key or Bearer token', example: 'Bearer your-api-key' }
    ],
    responses: [
      { 
        status: 200, 
        description: 'Members retrieved successfully',
        example: { 
          members: [{ id: 'user_123', email: 'user@example.com', role: 'admin' }],
          total: 5
        }
      },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' }
    ],
    authentication: 'api_key',
    rateLimit: '100 requests per minute',
    scope: ['members:read']
  }
];

export function ApiDocumentation() {
  const { organization } = useCurrentOrganization();
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [testRequest, setTestRequest] = useState({
    endpoint: '',
    method: 'GET',
    headers: '{"Authorization": "Bearer your-api-key"}',
    body: '',
    parameters: ''
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [openEndpoints, setOpenEndpoints] = useState<string[]>([]);

  const baseUrl = `https://api.yourapp.com`;
  const orgId = organization?.id || 'your-org-id';

  const toggleEndpoint = (path: string) => {
    setOpenEndpoints(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      PATCH: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{method}</Badge>;
  };

  const runTestRequest = async () => {
    try {
      // Simulate API test
      const mockResponse = {
        status: 200,
        data: { message: 'Test successful', timestamp: new Date().toISOString() },
        headers: { 'content-type': 'application/json' }
      };
      
      setTestResponse(mockResponse);
      toast.success('API test completed');
    } catch (error) {
      toast.error('API test failed');
    }
  };

  const generateCurlCommand = (endpoint: ApiEndpoint) => {
    const url = baseUrl + endpoint.path.replace('{org_id}', orgId);
    let curl = `curl -X ${endpoint.method} "${url}"`;
    
    if (endpoint.headers) {
      endpoint.headers.forEach(header => {
        curl += ` \\\n  -H "${header.name}: ${header.example}"`;
      });
    }
    
    if (endpoint.body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      curl += ` \\\n  -d '${endpoint.body}'`;
    }
    
    return curl;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Complete API reference and interactive testing for your organization
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              API v1.0
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="endpoints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="testing">API Testing</TabsTrigger>
              <TabsTrigger value="sdks">SDKs & Libraries</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">API Endpoints</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <code className="bg-muted px-2 py-1 rounded">{baseUrl}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(baseUrl)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {API_ENDPOINTS.map((endpoint, index) => {
                    const isOpen = openEndpoints.includes(endpoint.path);
                    const fullPath = endpoint.path.replace('{org_id}', orgId);
                    
                    return (
                      <Card key={index} className="border">
                        <Collapsible open={isOpen} onOpenChange={() => toggleEndpoint(endpoint.path)}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  {getMethodBadge(endpoint.method)}
                                  <code className="font-mono text-sm">{fullPath}</code>
                                </div>
                                <div className="flex items-center gap-2">
                                  {endpoint.authentication !== 'none' && (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {endpoint.rateLimit && (
                                    <Badge variant="outline" className="text-xs">
                                      {endpoint.rateLimit}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground text-left">
                                {endpoint.description}
                              </p>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {/* Parameters */}
                                {endpoint.parameters && endpoint.parameters.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Parameters</h4>
                                    <div className="space-y-2">
                                      {endpoint.parameters.map((param, idx) => (
                                        <div key={idx} className="grid grid-cols-4 gap-2 text-sm border-b pb-2">
                                          <div className="font-mono">{param.name}</div>
                                          <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                            {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                                          </div>
                                          <div className="text-muted-foreground">{param.description}</div>
                                          <div className="font-mono text-xs">{param.example}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Headers */}
                                {endpoint.headers && endpoint.headers.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Headers</h4>
                                    <div className="space-y-2">
                                      {endpoint.headers.map((header, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                                          <div className="font-mono">{header.name}</div>
                                          <div className="text-muted-foreground">{header.description}</div>
                                          <div className="font-mono text-xs">{header.example}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Request Body */}
                                {endpoint.body && (
                                  <div>
                                    <h4 className="font-medium mb-2">Request Body</h4>
                                    <div className="bg-muted p-3 rounded-md">
                                      <pre className="text-sm font-mono overflow-x-auto">{endpoint.body}</pre>
                                    </div>
                                  </div>
                                )}

                                {/* Responses */}
                                <div>
                                  <h4 className="font-medium mb-2">Responses</h4>
                                  <div className="space-y-2">
                                    {endpoint.responses.map((response, idx) => (
                                      <div key={idx} className="border rounded p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge 
                                            className={
                                              response.status < 300 ? 'bg-green-100 text-green-800' : 
                                              response.status < 400 ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                            }
                                          >
                                            {response.status}
                                          </Badge>
                                          <span className="text-sm">{response.description}</span>
                                        </div>
                                        {response.example && (
                                          <div className="bg-muted p-2 rounded text-xs font-mono">
                                            <pre>{JSON.stringify(response.example, null, 2)}</pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* cURL Example */}
                                <div>
                                  <h4 className="font-medium mb-2">cURL Example</h4>
                                  <div className="bg-black text-green-400 p-3 rounded-md relative">
                                    <pre className="text-sm font-mono overflow-x-auto">{generateCurlCommand(endpoint)}</pre>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="absolute top-2 right-2 text-green-400 hover:text-green-300"
                                      onClick={() => copyToClipboard(generateCurlCommand(endpoint))}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4">
              <div className="space-y-6">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    All API requests must include authentication. We support API keys and Bearer tokens.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>API Key Authentication</CardTitle>
                    <CardDescription>
                      Use your organization's API key in the Authorization header
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">Authorization: Bearer your-api-key-here</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can generate API keys in the API Management section of your organization settings.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rate Limiting</CardTitle>
                    <CardDescription>
                      API usage is limited based on your subscription tier
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Starter Plan:</span>
                        <span>100 requests/hour</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pro Plan:</span>
                        <span>1,000 requests/hour</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Enterprise Plan:</span>
                        <span>10,000 requests/hour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Testing Console</CardTitle>
                  <CardDescription>
                    Test API endpoints directly from the documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={testRequest.method} onValueChange={(value) => 
                        setTestRequest(prev => ({ ...prev, method: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Endpoint</Label>
                      <Input
                        placeholder="/api/v1/organizations/your-org-id"
                        value={testRequest.endpoint}
                        onChange={(e) => setTestRequest(prev => ({ ...prev, endpoint: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      placeholder='{"Authorization": "Bearer your-api-key"}'
                      value={testRequest.headers}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, headers: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {['POST', 'PUT', 'PATCH'].includes(testRequest.method) && (
                    <div className="space-y-2">
                      <Label>Request Body (JSON)</Label>
                      <Textarea
                        placeholder='{"title": "New Project"}'
                        value={testRequest.body}
                        onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                        rows={4}
                      />
                    </div>
                  )}

                  <Button onClick={runTestRequest} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>

                  {testResponse && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              {testResponse.status}
                            </Badge>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="bg-muted p-3 rounded-md">
                            <pre className="text-sm">{JSON.stringify(testResponse.data, null, 2)}</pre>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sdks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      JavaScript SDK
                    </CardTitle>
                    <CardDescription>
                      Official JavaScript/TypeScript SDK
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-black text-green-400 p-3 rounded-md">
                        <code className="text-sm">npm install @yourapp/api-sdk</code>
                      </div>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        View Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Python SDK
                    </CardTitle>
                    <CardDescription>
                      Official Python SDK
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-black text-green-400 p-3 rounded-md">
                        <code className="text-sm">pip install yourapp-api</code>
                      </div>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        View Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      REST API
                    </CardTitle>
                    <CardDescription>
                      Direct HTTP API access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Use any HTTP client to interact with our REST API endpoints.
                      </p>
                      <Button variant="outline" className="w-full">
                        <Book className="h-4 w-4 mr-2" />
                        API Reference
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      GraphQL
                    </CardTitle>
                    <CardDescription>
                      GraphQL API endpoint
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-muted p-3 rounded-md">
                        <code className="text-sm">{baseUrl}/graphql</code>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        GraphQL Playground
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}