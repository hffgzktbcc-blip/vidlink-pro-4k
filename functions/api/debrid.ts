// Cloudflare Pages Function: Real-Debrid API & OAuth CORS Proxy
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const endpoint = url.searchParams.get('endpoint');

  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Missing endpoint parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Construct target Real-Debrid URL
  // If endpoint starts with "oauth/", call https://api.real-debrid.com/oauth/...
  // Otherwise call https://api.real-debrid.com/rest/1.0/...
  let targetUrl = '';
  if (endpoint.startsWith('oauth/')) {
    targetUrl = `https://api.real-debrid.com/${endpoint}`;
  } else {
    targetUrl = `https://api.real-debrid.com/rest/1.0/${endpoint}`;
  }

  // Forward query parameters (excluding "endpoint")
  const forwardParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'endpoint') {
      forwardParams.append(key, value);
    }
  }
  const queryString = forwardParams.toString();
  if (queryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
  }

  // Forward authorization header & content-type
  const authHeader = context.request.headers.get('Authorization');
  const contentType = context.request.headers.get('Content-Type');

  const headers: Record<string, string> = {
    'User-Agent': 'Lumia4K/1.1.0 (CloudflarePagesEdge)',
  };
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    let body: any = null;
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      body = await context.request.text();
    }

    const rdResponse = await fetch(targetUrl, {
      method: context.request.method,
      headers,
      body: body || undefined,
    });

    const responseData = await rdResponse.text();

    return new Response(responseData, {
      status: rdResponse.status,
      headers: {
        'Content-Type': rdResponse.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Edge proxy error' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
