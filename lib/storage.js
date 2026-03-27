const Redis = require('ioredis');

const STORAGE_KEY = 'board:state';

// In-memory fallback for local dev
let memoryStore = null;

// Reuse Redis connection across invocations (Vercel keeps warm instances)
let redisClient = null;

function getDefaultState() {
  return {
    mode: 'aircraft',
    customLines: [],
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

function getRedis() {
  const url = process.env.board_REDIS_URL || process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClient) {
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true
    });
    redisClient.on('error', () => {});
  }
  return redisClient;
}

async function getBoardState() {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.connect().catch(() => {});
      const raw = await redis.get(STORAGE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (!state.mode) state.mode = 'aircraft';
        if (!state.customLines) state.customLines = [];
        return state;
      }
      return getDefaultState();
    } catch (e) {
      return getDefaultState();
    }
  }
  return memoryStore || getDefaultState();
}

async function setBoardState(state) {
  state.lastUpdated = new Date().toISOString();

  const redis = getRedis();
  if (redis) {
    try {
      await redis.connect().catch(() => {});
      await redis.set(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Fall through silently
    }
  } else {
    memoryStore = state;
  }
  return state;
}

module.exports = { getBoardState, setBoardState, getDefaultState };
