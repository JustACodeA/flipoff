const STORAGE_KEY = 'board:state';

// In-memory fallback for local dev (when Upstash is not configured)
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

// Direct Upstash Redis REST API — no npm package needed
async function redisGet(key) {
  const url = process.env.board_REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.board_REDIS_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (data.result === null || data.result === undefined) return null;
  return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
}

async function redisSet(key, value) {
  const url = process.env.board_REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.board_REDIS_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
}

async function getBoardState() {
  const state = await redisGet(STORAGE_KEY);
  if (state) {
    if (!state.mode) state.mode = 'aircraft';
    if (!state.customLines) state.customLines = [];
    return state;
  }

  const url = process.env.board_REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (url) return getDefaultState();

  // No Redis configured — use in-memory
  return memoryStore || getDefaultState();
}

async function setBoardState(state) {
  state.lastUpdated = new Date().toISOString();

  const url = process.env.board_REDIS_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (url) {
    await redisSet(STORAGE_KEY, state);
  } else {
    memoryStore = state;
  }
  return state;
}

module.exports = { getBoardState, setBoardState, getDefaultState };
