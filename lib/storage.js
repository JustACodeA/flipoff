const STORAGE_KEY = 'board:state';

// In-memory fallback for local dev (when Redis is not configured)
let memoryStore = null;

function getDefaultState() {
  return {
    mode: 'aircraft',       // 'aircraft' or 'message'
    customLines: [],        // free-text lines for message mode
    aircraft: [
      {
        id: '1',
        registration: '------',
        status: 'READY',
        etd: '',
        eta: '',
        duration: 0
      },
      {
        id: '2',
        registration: '------',
        status: 'READY',
        etd: '',
        eta: '',
        duration: 0
      }
    ],
    lastUpdated: new Date().toISOString()
  };
}

// Resolve the REST URL and token from all possible Vercel Redis env var patterns
function getRedisConfig() {
  // Vercel Redis with custom prefix "board" sets: board_REST_URL, board_REST_TOKEN
  // Also try: board_REDIS_URL (might be redis:// or https://), KV_REST_API_URL, UPSTASH_REDIS_REST_URL
  const url =
    process.env.board_REST_URL ||
    process.env.board_KV_REST_API_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.board_REDIS_URL ||
    null;

  const token =
    process.env.board_REST_TOKEN ||
    process.env.board_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.board_REDIS_TOKEN ||
    null;

  // Only use if it's an https:// REST URL (not redis:// connection string)
  if (!url || !token || !url.startsWith('https://')) return null;
  return { url, token };
}

// Direct Upstash/Vercel Redis REST API — no npm package needed
async function redisGet(key) {
  const config = getRedisConfig();
  if (!config) return null;

  const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${config.token}` }
  });
  const data = await res.json();
  if (data.result === null || data.result === undefined) return null;
  return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
}

async function redisSet(key, value) {
  const config = getRedisConfig();
  if (!config) return;

  await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['SET', key, JSON.stringify(value)])
  });
}

async function getBoardState() {
  const state = await redisGet(STORAGE_KEY);
  if (state) {
    if (!state.mode) state.mode = 'aircraft';
    if (!state.customLines) state.customLines = [];
    return state;
  }

  if (getRedisConfig()) return getDefaultState();

  // No Redis configured — use in-memory
  return memoryStore || getDefaultState();
}

async function setBoardState(state) {
  state.lastUpdated = new Date().toISOString();

  if (getRedisConfig()) {
    await redisSet(STORAGE_KEY, state);
  } else {
    memoryStore = state;
  }
  return state;
}

module.exports = { getBoardState, setBoardState, getDefaultState };
