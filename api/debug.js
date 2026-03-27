const { validateAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (!validateAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Show which Redis env vars are set (values masked)
  const vars = [
    'board_REST_URL', 'board_REST_TOKEN',
    'board_KV_REST_API_URL', 'board_KV_REST_API_TOKEN',
    'board_REDIS_URL', 'board_REDIS_TOKEN',
    'board_URL', 'board_TOKEN',
    'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
    'API_SECRET'
  ];

  const env = {};
  for (const v of vars) {
    const val = process.env[v];
    if (val) {
      env[v] = val.substring(0, 12) + '...';
    }
  }

  return res.status(200).json({ env });
};
