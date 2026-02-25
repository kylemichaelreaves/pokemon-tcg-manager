"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const cardHandlers = __importStar(require("./handlers/cards"));
const collectionHandlers = __importStar(require("./handlers/collections"));
const health_1 = require("./handlers/health");
const PORT = parseInt(process.env.API_PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const routes = [
    // Health
    { method: 'GET', pattern: /^\/api\/health$/, handler: health_1.handler, params: [] },
    // Cards (read-only catalog)
    { method: 'GET', pattern: /^\/api\/cards$/, handler: cardHandlers.getCards, params: [] },
    { method: 'GET', pattern: /^\/api\/cards\/([^/]+)$/, handler: cardHandlers.getCardById, params: ['id'] },
    // Sets (reference data)
    { method: 'GET', pattern: /^\/api\/sets$/, handler: cardHandlers.getSets, params: [] },
    // Collection (user's owned cards)
    { method: 'GET', pattern: /^\/api\/collection$/, handler: collectionHandlers.getCollection, params: [] },
    { method: 'POST', pattern: /^\/api\/collection$/, handler: collectionHandlers.addToCollection, params: [] },
    { method: 'GET', pattern: /^\/api\/collection\/summary$/, handler: collectionHandlers.getCompletionSummary, params: [] },
    { method: 'GET', pattern: /^\/api\/collection\/([^/]+)$/, handler: collectionHandlers.getCollectionEntry, params: ['id'] },
    { method: 'PUT', pattern: /^\/api\/collection\/([^/]+)$/, handler: collectionHandlers.updateCollectionEntry, params: ['id'] },
    { method: 'DELETE', pattern: /^\/api\/collection\/([^/]+)$/, handler: collectionHandlers.removeFromCollection, params: ['id'] },
];
const server = node_http_1.default.createServer(async (req, res) => {
    const corsHeaders = {
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
    for (const route of routes) {
        if (route.method !== method)
            continue;
        const match = url.pathname.match(route.pattern);
        if (!match)
            continue;
        const pathParameters = {};
        route.params.forEach((param, i) => {
            pathParameters[param] = match[i + 1];
        });
        const queryStringParameters = {};
        url.searchParams.forEach((value, key) => {
            queryStringParameters[key] = value;
        });
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }
        const event = {
            version: '2.0',
            routeKey: `${method} ${url.pathname}`,
            rawPath: url.pathname,
            rawQueryString: url.search.slice(1),
            headers: req.headers,
            queryStringParameters,
            pathParameters,
            body: body || undefined,
            isBase64Encoded: false,
            requestContext: {},
        };
        try {
            const result = await route.handler(event);
            res.writeHead(result.statusCode, { ...corsHeaders, ...result.headers });
            res.end(result.body);
        }
        catch (err) {
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
//# sourceMappingURL=server.js.map