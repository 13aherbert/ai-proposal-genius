
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function handleCors(req: Request): Response | null {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }
  return null
}

// Helper to attach CORS headers to any response
export function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value)
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
