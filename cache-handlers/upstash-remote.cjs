const { Redis } = require('@upstash/redis');

const CACHE_PREFIX = 'next:cache:v1';
const TAG_PREFIX = 'next:cache-tag:v1';
const FALLBACK_TTL_SECONDS = 60 * 60 * 24 * 60;

const memoryCache = new Map();
const memoryTags = new Map();
const pendingSets = new Map();

function getClient() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });
}

function cacheKey(key) {
  return `${CACHE_PREFIX}:${key}`;
}

function tagKey(tag) {
  return `${TAG_PREFIX}:${tag}`;
}

async function entryToStored(entry) {
  const reader = entry.value.getReader();
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return {
    expire: entry.expire,
    revalidate: entry.revalidate,
    stale: entry.stale,
    tags: entry.tags,
    timestamp: entry.timestamp,
    value: Buffer.concat(chunks).toString('base64'),
  };
}

function storedToEntry(stored) {
  return {
    expire: stored.expire,
    revalidate: stored.revalidate,
    stale: stored.stale,
    tags: stored.tags ?? [],
    timestamp: stored.timestamp,
    value: new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from(stored.value, 'base64'));
        controller.close();
      },
    }),
  };
}

function isExpired(stored, tagExpiration) {
  const now = Date.now();
  if (stored.expire && now > stored.timestamp + stored.expire * 1000) return true;
  if (stored.revalidate && now > stored.timestamp + stored.revalidate * 1000) return true;
  return tagExpiration > stored.timestamp;
}

async function getTagExpiration(kv, tags) {
  if (tags.length === 0) return 0;

  if (!kv) {
    return Math.max(...tags.map(tag => memoryTags.get(tag) ?? 0), 0);
  }

  const values = await Promise.all(tags.map(tag => kv.get(tagKey(tag))));
  return Math.max(...values.map(value => Number(value) || 0), 0);
}

module.exports = {
  async get(key, softTags) {
    const pending = pendingSets.get(key);
    if (pending) await pending;

    const kv = getClient();
    const stored = kv ? await kv.get(cacheKey(key)) : memoryCache.get(key);
    if (!stored) return undefined;

    const tags = [...(stored.tags ?? []), ...(softTags ?? [])];
    const tagExpiration = await getTagExpiration(kv, tags);
    if (isExpired(stored, tagExpiration)) return undefined;

    return storedToEntry(stored);
  },

  async set(key, pendingEntry) {
    let resolvePending;
    const pending = new Promise(resolve => {
      resolvePending = resolve;
    });
    pendingSets.set(key, pending);

    try {
      const entry = await pendingEntry;
      const stored = await entryToStored(entry);
      const ttl = Math.max(1, stored.expire || FALLBACK_TTL_SECONDS);
      const kv = getClient();
      if (kv) {
        await kv.set(cacheKey(key), stored, { ex: ttl });
      } else {
        memoryCache.set(key, stored);
      }
    } finally {
      resolvePending();
      pendingSets.delete(key);
    }
  },

  async refreshTags() {},

  async getExpiration(tags) {
    return getTagExpiration(getClient(), tags);
  },

  async updateTags(tags, durations) {
    const now = Date.now();
    const ttl = Math.max(1, durations?.expire ?? FALLBACK_TTL_SECONDS);
    const kv = getClient();

    if (kv) {
      await Promise.all(tags.map(tag => kv.set(tagKey(tag), now, { ex: ttl })));
      return;
    }

    for (const tag of tags) {
      memoryTags.set(tag, now);
      for (const [key, entry] of memoryCache.entries()) {
        if ((entry.tags ?? []).includes(tag)) memoryCache.delete(key);
      }
    }
  },
};
