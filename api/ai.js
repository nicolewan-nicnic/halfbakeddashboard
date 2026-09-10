// Proxy for the Claude calls the app makes (photo intake, recipe paste).
// Keeps ANTHROPIC_API_KEY server-side — the browser must never see it.
//
//   POST /api/ai   { model, max_tokens, system?, messages }  ->  Anthropic's JSON response
//
// The request is NOT passed through verbatim: only model / max_tokens / system /
// messages are forwarded, the model must be on the allow-list, max_tokens is
// clamped, and the whole body is size-capped. This is a spend guard, not a
// substitute for a real rate limiter — that needs shared state (see /api/kv).
//
// Set ANTHROPIC_API_KEY. A PRODUCTION deploy must also set APP_TOKEN (callers
// then send `Authorization: Bearer <APP_TOKEN>`); preview/dev may run open, or
// force it open with ALLOW_OPEN_STORE=1.

const TOKEN = process.env.APP_TOKEN || '';
const OPEN_OK = process.env.VERCEL_ENV !== 'production' || process.env.ALLOW_OPEN_STORE === '1';
const MODEL_OK = /^claude-(?:sonnet|haiku|opus)-[0-9][a-z0-9.\-]*$/i;
const MAX_TOKENS_CAP = 2000;
const MAX_BODY_BYTES = 6 * 1024 * 1024;   // room for one base64 photo, not much more

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!TOKEN && !OPEN_OK) {
    return res.status(503).json({ error: 'AI proxy not configured: set APP_TOKEN (or ALLOW_OPEN_STORE=1) on this deployment' });
  }
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'unauthorised' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });

  let src;
  try { src = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: 'body is not JSON' }); }

  if (!MODEL_OK.test(String(src.model || ''))) {
    return res.status(400).json({ error: 'model not allowed' });
  }
  if (!Array.isArray(src.messages) || !src.messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }
  const safe = {
    model: String(src.model),
    max_tokens: Math.min(Math.max(1, Number(src.max_tokens) || 1000), MAX_TOKENS_CAP),
    messages: src.messages,
  };
  if (typeof src.system === 'string') safe.system = src.system.slice(0, 20000);

  const body = JSON.stringify(safe);
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'request too large' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body,
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('content-type', 'application/json');
    return res.send(text);
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'upstream error' });
  }
}
