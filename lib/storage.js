const STORAGE_KEY = 'board:state';

// In-memory fallback for local dev (when Vercel KV is not configured)
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

async function getKV() {
  if (process.env.KV_REST_API_URL) {
    const { kv } = await import('@vercel/kv');
    return kv;
  }
  return null;
}

async function getBoardState() {
  const kv = await getKV();
  if (kv) {
    const state = await kv.get(STORAGE_KEY);
    if (state) {
      // Ensure new fields exist on old data
      if (!state.mode) state.mode = 'aircraft';
      if (!state.customLines) state.customLines = [];
      return state;
    }
    return getDefaultState();
  }
  return memoryStore || getDefaultState();
}

async function setBoardState(state) {
  state.lastUpdated = new Date().toISOString();
  const kv = await getKV();
  if (kv) {
    await kv.set(STORAGE_KEY, state);
  } else {
    memoryStore = state;
  }
  return state;
}

module.exports = { getBoardState, setBoardState, getDefaultState };
