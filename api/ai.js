// Proxy for the Claude calls the app makes (photo intake, recipe paste).
// Keeps ANTHROPIC_API_KEY server-side — the browser must never see it.
//
//   POST /api/ai   { ...Anthropic Messages API request body }  ->  Anthropic's JSON response
//
// Set ANTHROPIC_API_KEY in the environment. If APP_TOKEN is also set, callers
// must send `Authorization: Bearer <APP_TOKEN>` (same secret as /api/kv).

const TOKEN = process.env.APP_TOKEN || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(401).json({ error: 'unauthorised' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ error: 'ANTHROPIC_API_KEY is not set on the server' });

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
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
