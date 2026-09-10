// Key/value store for Half Baked Society.
//
//   GET  /api/kv?key=hbs:fridge   -> { key, value }   (404 if never written)
//   GET  /api/kv?all=1            -> { "hbs:fridge": …, … }   one round trip
//   PUT  /api/kv  { key, value }  -> { ok: true }
//
// Every key is a separate row, so deploying a new build never rewrites a
// store it did not touch.
//
// Auth: set APP_TOKEN in the environment to lock the store down. Writes, the
// `all` read, and reads of anything other than the PUBLIC recipe keys and the
// per-recipe `hbs:share.<id>` snapshots then require
// `Authorization: Bearer <APP_TOKEN>`. The owner supplies it once via
// ?k=<token> in the app URL.
//
// A PRODUCTION deploy (VERCEL_ENV=production) MUST set APP_TOKEN, or the store
// refuses to serve — an unauthenticated open store on the public internet is a
// bug, not a feature. Preview/dev deploys stay open so they are easy to test.
// Set ALLOW_OPEN_STORE=1 to deliberately keep production open.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

// Recipe ids carry digits and hyphens, so `hbs:share.<id>` keys need those too.
const ALLOWED = /^hbs:[a-z0-9._-]+$/;        // nothing else can be written
const TOKEN = process.env.APP_TOKEN || '';   // shared secret (required in production)
const OPEN_OK = process.env.VERCEL_ENV !== 'production' || process.env.ALLOW_OPEN_STORE === '1';
const MISCONFIGURED = !TOKEN && !OPEN_OK;    // production with no token and no override

// Readable without the token so share links work for people who don't have it:
// the whole-collection keys, plus every single-recipe share snapshot.
const PUBLIC = new Set(['hbs:recipes.mine', 'hbs:recipes.overrides', 'hbs:recipes.removed']);
const isPublic = (key) => PUBLIC.has(key) || key.startsWith('hbs:share.');

export default async function handler(req, res) {
  if (MISCONFIGURED) {
    return res.status(503).json({ error: 'store not configured: set APP_TOKEN (or ALLOW_OPEN_STORE=1) on this deployment' });
  }
  const authed = !TOKEN || req.headers.authorization === `Bearer ${TOKEN}`;

  try {
    if (req.method === 'GET') {
      if (req.query.all) {
        if (!authed) return res.status(404).json({ error: 'not found' });
        const rows = await sql`SELECT key, value FROM store`;
        const out = {};
        for (const r of rows) out[r.key] = r.value;
        return res.status(200).json(out);
      }
      const key = String(req.query.key || '');
      if (!ALLOWED.test(key)) return res.status(404).json({ error: 'not found' });
      // Don't distinguish "forbidden" from "missing" for non-owners.
      if (!authed && !isPublic(key)) return res.status(404).json({ error: 'not found' });
      const rows = await sql`SELECT value FROM store WHERE key = ${key}`;
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ key, value: rows[0].value });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      if (!authed) return res.status(401).json({ error: 'unauthorised' });
      const { key, value } = req.body || {};
      if (!ALLOWED.test(String(key || ''))) return res.status(400).json({ error: 'bad key' });
      await sql`
        INSERT INTO store (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
        ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}
