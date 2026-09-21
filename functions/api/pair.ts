// Cloudflare Pages Function: 6-Digit Instant TV Pairing Endpoint
interface Env {
  // Cloudflare KV binding if configured, otherwise uses edge in-memory map
  LUMIA_KV?: KVNamespace;
}

// In-memory fallback map for edge instances (10-minute TTL)
const ephemeralPins = new Map<string, { data: string; expiresAt: number }>();

function cleanupExpired() {
  const now = Date.now();
  for (const [pin, val] of ephemeralPins.entries()) {
    if (val.expiresAt < now) {
      ephemeralPins.delete(pin);
    }
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  cleanupExpired();

  try {
    const body = await context.request.json();
    if (!body) {
      return new Response(JSON.stringify({ error: 'Missing payload' }), { status: 400 });
    }

    // Generate random 6-digit numeric PIN (e.g. 482195)
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const payloadString = JSON.stringify(body);

    if (context.env.LUMIA_KV) {
      await context.env.LUMIA_KV.put(`pin:${pin}`, payloadString, { expirationTtl: 600 });
    } else {
      ephemeralPins.set(pin, { data: payloadString, expiresAt });
    }

    return new Response(
      JSON.stringify({
        success: true,
        pin,
        formattedPin: `${pin.slice(0, 3)}-${pin.slice(3)}`,
        expiresAt,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to create PIN' }), { status: 500 });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  cleanupExpired();

  const url = new URL(context.request.url);
  const rawPin = url.searchParams.get('pin')?.replace(/\D/g, '');

  if (!rawPin || rawPin.length !== 6) {
    return new Response(JSON.stringify({ error: 'Valid 6-digit PIN required' }), { status: 400 });
  }

  let dataString: string | null = null;

  if (context.env.LUMIA_KV) {
    dataString = await context.env.LUMIA_KV.get(`pin:${rawPin}`);
  } else {
    const item = ephemeralPins.get(rawPin);
    if (item && item.expiresAt > Date.now()) {
      dataString = item.data;
    }
  }

  if (!dataString) {
    return new Response(JSON.stringify({ error: 'PIN expired or not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(dataString, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
