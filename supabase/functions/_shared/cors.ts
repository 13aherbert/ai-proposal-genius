
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// Add CORS headers to a Response
export function addCorsHeaders(response: Response): Response {
  // Create a new response with the same body, status, and statusText
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}

// Handle CORS preflight requests
export function handleCors(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Return null to continue processing the request
  return null;
}
