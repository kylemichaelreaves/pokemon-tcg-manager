import http from 'node:http';
import fs from 'node:fs';
import nodePath from 'node:path';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as cardHandlers from './handlers/cards';
import * as collectionHandlers from './handlers/collections';
import { handler as healthHandler } from './handlers/health';

const PORT = parseInt(process.env.API_PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const STATIC_IMAGES_DIR = process.env.STATIC_IMAGES_DIR || '';

type Handler = (
  event: APIGatewayProxyEventV2,
) => Promise<{ statusCode: number; body: string; headers?: Record<string, string> }>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
  params: string[];
}

const routes: Route[] = [
  // Health
  { method: 'GET', pattern: /^\/api\/health$/, handler: healthHandler as Handler, params: [] },

  // Cards (read-only catalog)
  {
    method: 'GET',
    pattern: /^\/api\/cards$/,
    handler: cardHandlers.getCards as Handler,
    params: [],
  },
  {
    method: 'GET',
    pattern: /^\/api\/cards\/([^/]+)$/,
    handler: cardHandlers.getCardById as Handler,
    params: ['id'],
  },

  // Sets (reference data)
  { method: 'GET', pattern: /^\/api\/sets$/, handler: cardHandlers.getSets as Handler, params: [] },

  // Collection (user's owned cards)
  {
    method: 'GET',
    pattern: /^\/api\/collection$/,
    handler: collectionHandlers.getCollection as Handler,
    params: [],
  },
  {
    method: 'POST',
    pattern: /^\/api\/collection$/,
    handler: collectionHandlers.addToCollection as Handler,
    params: [],
  },
  {
    method: 'GET',
    pattern: /^\/api\/collection\/summary$/,
    handler: collectionHandlers.getCompletionSummary as Handler,
    params: [],
  },
  {
    method: 'GET',
    pattern: /^\/api\/collection\/([^/]+)$/,
    handler: collectionHandlers.getCollectionEntry as Handler,
    params: ['id'],
  },
  {
    method: 'PUT',
    pattern: /^\/api\/collection\/([^/]+)$/,
    handler: collectionHandlers.updateCollectionEntry as Handler,
    params: ['id'],
  },
  {
    method: 'DELETE',
    pattern: /^\/api\/collection\/([^/]+)$/,
    handler: collectionHandlers.removeFromCollection as Handler,
    params: ['id'],
  },
];

const server = http.createServer(async (req, res) => {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const method = req.method || 'GET';

  // Serve static card images for local development
  if (STATIC_IMAGES_DIR && method === 'GET' && url.pathname.startsWith('/images/')) {
    const relativePath = url.pathname.slice('/images/'.length);
    const safePath = nodePath.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
    const filePath = nodePath.join(STATIC_IMAGES_DIR, safePath);

    if (!filePath.startsWith(nodePath.resolve(STATIC_IMAGES_DIR))) {
      res.writeHead(403, corsHeaders);
      res.end('Forbidden');
      return;
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = nodePath.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
        };
        res.writeHead(200, {
          ...corsHeaders,
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch {
      // File not found — fall through
    }

    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ success: false, error: 'Image not found' }));
    return;
  }

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = url.pathname.match(route.pattern);
    if (!match) continue;

    const pathParameters: Record<string, string> = {};
    route.params.forEach((param, i) => {
      pathParameters[param] = match[i + 1];
    });

    const queryStringParameters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryStringParameters[key] = value;
    });

    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const event: APIGatewayProxyEventV2 = {
      version: '2.0',
      routeKey: `${method} ${url.pathname}`,
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: req.headers as Record<string, string>,
      queryStringParameters,
      pathParameters,
      body: body || undefined,
      isBase64Encoded: false,
      requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    };

    try {
      const result = await route.handler(event);
      res.writeHead(result.statusCode, { ...corsHeaders, ...result.headers });
      res.end(result.body);
    } catch (err) {
      console.error('Handler error:', err);
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ success: false, error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Pokemon TCG API running at http://localhost:${PORT}`);
});
