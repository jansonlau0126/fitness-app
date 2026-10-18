export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  ALLOWED_ORIGINS?: string;
}

type GooglePayload = { sub: string; email?: string; name?: string; picture?: string; aud?: string; exp?: number; iss?: string };

const GOOGLE_CERTS = 'https://www.googleapis.com/oauth2/v3/certs';
let jwksCache: { keys: JsonWebKey[]; at: number } | null = null;

function cors(origin: string | null, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'Access-Control-Allow-Origin': ok,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function getJwks(): Promise<JsonWebKey[]> {
  if (jwksCache && Date.now() - jwksCache.at < 3600_000) return jwksCache.keys;
  const res = await fetch(GOOGLE_CERTS);
  const body = await res.json() as { keys: JsonWebKey[] };
  jwksCache = { keys: body.keys, at: Date.now() };
  return body.keys;
}

function b64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function parseB64url(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyGoogleIdToken(token: string, clientId: string): Promise<GooglePayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const header = JSON.parse(new TextDecoder().decode(parseB64url(h))) as { kid?: string; alg?: string };
  if (header.alg !== 'RS256') return null;
  const keys = await getJwks();
  const jwk = keys.find((k) => (k as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, parseB64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const payload = JSON.parse(new TextDecoder().decode(parseB64url(p))) as GooglePayload;
  if (payload.aud !== clientId) return null;
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') return null;
  if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
  if (!payload.sub) return null;
  return payload;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = cors(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/api/health') {
      return json({ ok: true, app: 'gym-everyday-api', googleConfigured: !!env.GOOGLE_CLIENT_ID }, 200, headers);
    }

    if (!env.GOOGLE_CLIENT_ID) {
      return json({ error: 'Google Sign-In not configured. Set GOOGLE_CLIENT_ID secret on the Worker.' }, 503, headers);
    }

    if (url.pathname === '/api/me' && request.method === 'GET') {
      const auth = request.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const user = token ? await verifyGoogleIdToken(token, env.GOOGLE_CLIENT_ID) : null;
      if (!user) return json({ error: 'Unauthorized' }, 401, headers);
      return json({ userId: user.sub, email: user.email, name: user.name, picture: user.picture }, 200, headers);
    }

    if (url.pathname === '/api/sync') {
      const auth = request.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      const user = token ? await verifyGoogleIdToken(token, env.GOOGLE_CLIENT_ID) : null;
      if (!user) return json({ error: 'Unauthorized' }, 401, headers);

      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT payload, updated_at, email, name, picture FROM user_data WHERE user_id = ?')
          .bind(user.sub).first<{ payload: string; updated_at: number; email: string; name: string; picture: string }>();
        if (!row) return json({ data: null, updatedAt: null }, 200, headers);
        return json({ data: JSON.parse(row.payload), updatedAt: row.updated_at }, 200, headers);
      }

      if (request.method === 'PUT') {
        const body = await request.json() as { data: unknown; updatedAt?: number };
        if (!body || typeof body.data !== 'object' || body.data === null) {
          return json({ error: 'Invalid body' }, 400, headers);
        }
        const clientAt = Number(body.updatedAt) || 0;
        const existing = await env.DB.prepare('SELECT updated_at FROM user_data WHERE user_id = ?')
          .bind(user.sub).first<{ updated_at: number }>();
        if (existing && existing.updated_at > clientAt) {
          const row = await env.DB.prepare('SELECT payload, updated_at FROM user_data WHERE user_id = ?')
            .bind(user.sub).first<{ payload: string; updated_at: number }>();
          return json({ conflict: true, data: JSON.parse(row!.payload), updatedAt: row!.updated_at }, 409, headers);
        }
        const now = Date.now();
        const payload = JSON.stringify(body.data);
        await env.DB.prepare(
          `INSERT INTO user_data (user_id, email, name, picture, payload, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             email=excluded.email, name=excluded.name, picture=excluded.picture,
             payload=excluded.payload, updated_at=excluded.updated_at`,
        ).bind(user.sub, user.email || null, user.name || null, user.picture || null, payload, now).run();
        return json({ ok: true, updatedAt: now }, 200, headers);
      }
    }

    return json({ error: 'Not found' }, 404, headers);
  },
};
