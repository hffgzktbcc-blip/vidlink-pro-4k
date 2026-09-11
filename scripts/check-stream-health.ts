import fs from 'node:fs';
import path from 'node:path';

interface ServerCheckResult {
  id: string;
  name: string;
  online: boolean;
  latencyMs: number;
  statusCode?: number;
  lastChecked: string;
}

interface StreamHealthReport {
  updatedAt: string;
  servers: ServerCheckResult[];
  fastestServerId: string;
}

const SERVERS_TO_TEST = [
  { id: 'vidlink-pro', name: 'VidLink Pro 4K (Ultra HD)', testUrl: 'https://vidlink.pro/movie/693134' },
  { id: 'vidlink-v2', name: 'VidLink Direct Fast (1080p)', testUrl: 'https://vidlink.pro/movie/693134' },
  { id: 'embed-su', name: 'Embed.su 4K Mirror', testUrl: 'https://embed.su/embed/movie/693134' },
  { id: 'autoembed', name: 'AutoEmbed Ultra Server', testUrl: 'https://player.autoembed.cc/embed/movie/693134' },
  { id: 'superembed', name: 'SuperEmbed Multi-Server', testUrl: 'https://multiembed.mov/?video_id=693134&tmdb=1' },
  { id: 'vidsrc-cc', name: 'VidSrc Direct Stream', testUrl: 'https://vidsrc.cc/v2/embed/movie/693134' },
];

async function checkServer(server: typeof SERVERS_TO_TEST[0]): Promise<ServerCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(server.testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const latency = Date.now() - start;
    const online = res.status < 500;

    return {
      id: server.id,
      name: server.name,
      online,
      latencyMs: latency,
      statusCode: res.status,
      lastChecked: new Date().toISOString(),
    };
  } catch {
    // If HEAD fails, try a fast GET with early abort
    try {
      const getRes = await fetch(server.testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const latency = Date.now() - start;
      return {
        id: server.id,
        name: server.name,
        online: getRes.status < 500,
        latencyMs: latency,
        statusCode: getRes.status,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      return {
        id: server.id,
        name: server.name,
        online: false,
        latencyMs: 9999,
        lastChecked: new Date().toISOString(),
      };
    }
  }
}

async function main() {
  console.log('🔍 Testing live stream mirrors for latency & availability...');

  const results = await Promise.all(SERVERS_TO_TEST.map(s => checkServer(s)));

  // Rank online servers by lowest latency
  const sortedOnline = results
    .filter(r => r.online)
    .sort((a, b) => a.latencyMs - b.latencyMs);

  const fastestServerId = sortedOnline.length > 0 ? sortedOnline[0].id : 'vidlink-pro';

  const report: StreamHealthReport = {
    updatedAt: new Date().toISOString(),
    servers: results,
    fastestServerId,
  };

  const outDir = path.resolve(process.cwd(), 'public/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targetFile = path.join(outDir, 'stream-health.json');
  fs.writeFileSync(targetFile, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`✅ Stream health report generated: ${targetFile}`);
  console.log(`⚡ Recommended fastest mirror: ${fastestServerId}`);
  results.forEach(r => {
    const status = r.online ? `🟢 ONLINE (${r.latencyMs}ms)` : `🔴 OFFLINE`;
    console.log(`  - ${r.name}: ${status}`);
  });
}

main();
