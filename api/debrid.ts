export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
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

  let targetUrl = endpoint.startsWith('oauth/')
    ? `https://api.real-debrid.com/${endpoint}`
    : `https://api.real-debrid.com/rest/1.0/${endpoint}`;

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

  const authHeader = request.headers.get('Authorization');
  const contentType = request.headers.get('Content-Type');

  const headers: Record<string, string> = {
    'User-Agent': 'Lumia4K/1.1.0 (VercelEdge)',
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (contentType) headers['Content-Type'] = contentType;

  try {
    let body: any = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    const rdResponse = await fetch(targetUrl, {
      method: request.method,
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
}
