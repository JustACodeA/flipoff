module.exports = async function handler(req, res) {
  // Auth via header or query param (so it works in a browser URL bar)
  const secret = process.env.API_SECRET;
  const authHeader = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const queryKey = req.query.key || '';

  if (secret && authHeader !== secret && queryKey !== secret) {
    return res.status(401).json({ error: 'Unauthorized. Use ?key=YOUR_SECRET' });
  }

  // Show which Redis env vars are set (values masked)
  const vars = [
    'board_REST_URL', 'board_REST_TOKEN',
    'board_KV_REST_API_URL', 'board_KV_REST_API_TOKEN',
    'board_REDIS_URL', 'board_REDIS_TOKEN',
    'board_URL', 'board_TOKEN',
    'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'KV_URL',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
    'REDIS_URL', 'REDIS_REST_URL', 'REDIS_REST_TOKEN',
    'API_SECRET'
  ];

  const env = {};
  for (const v of vars) {
    const val = process.env[v];
    if (val) {
      env[v] = val.substring(0, 20) + '...';
    }
  }

  return res.status(200).json({ env });
};
