// Key/value store for Half Baked Society.
//
//   GET  /api/kv?key=hbs:fridge   -> { key, value }   (404 if never written)
//   GET  /api/kv?all=1            -> { "hbs:fridge": …, … }   one round trip
//   PUT  /api/kv  { key, value }  -> { ok: true }
//
// Every key is a separate row, so deploying a new build never rewrites a
// store it did not touch.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

const ALLOWED = /^hbs:[a-z.]+$/;             // nothing else can be written
const TOKEN = process.env.APP_TOKEN || '';   // optional shared secret

export default async function handler(req, res) {
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'unauthorised' });
  }

  try {
    if (req.method === 'GET') {
      if (req.query.all) {
        const rows = await sql`SELECT key, value FROM store`;
        const out = {};
        for (const r of rows) out[r.key] = r.value;
        return res.status(200).json(out);
      }
      const key = String(req.query.key || '');
      if (!ALLOWED.test(key)) return res.status(400).json({ error: 'bad key' });
      const rows = await sql`SELECT value FROM store WHERE key = ${key}`;
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ key, value: rows[0].value });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
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
