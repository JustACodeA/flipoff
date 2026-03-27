function validateAuth(req) {
  const secret = process.env.API_SECRET;
  if (!secret) return true; // No secret configured = no auth required (dev mode)

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === secret;
}

module.exports = { validateAuth };
