const { Redis } = require('@upstash/redis');

const PREFIX = 'next-cache:v1';
const TAG_PREFIX = `${PREFIX}:tag`;
const pendingSets = new Map();

function getClient() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });
}

function entryKey(cacheKey) {
  return `${PREFIX}:entry:${cacheKey}`;
}

function tagKey(tag) {
  return `${TAG_PREFIX}:${tag}`;
}

function streamFromBase64(value) {
  const bytes = Buffer.from(value, 'base64');
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function streamToBase64(stream) {
  const reader = stream.getReader();
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

  return Buffer.concat(chunks).toString('base64');
}

async function getExpirationFor(client, tags) {
  if (tags.length === 0) return 0;
  const values = await client.mget(...tags.map(tagKey));
  return values.reduce((max, value) => Math.max(max, Number(value) || 0), 0);
}

module.exports = {
  async get(cacheKey, softTags) {
    const client = getClient();
    if (!client) return undefined;

    const pending = pendingSets.get(cacheKey);
    if (pending) await pending;

    try {
      const stored = await client.get(entryKey(cacheKey));
      if (!stored) return undefined;

      const entry = typeof stored === 'string' ? JSON.parse(stored) : stored;
      const now = Date.now();
      const expiresAt = entry.timestamp + entry.expire * 1000;
      if (now > expiresAt) return undefined;

      const revalidatedAt = await getExpirationFor(client, [...softTags, ...entry.tags]);
      if (revalidatedAt > entry.timestamp) return undefined;

      return {
        expire: entry.expire,
        revalidate: entry.revalidate,
        stale: entry.stale,
        tags: entry.tags,
        timestamp: entry.timestamp,
        value: streamFromBase64(entry.value),
      };
    } catch {
      return undefined;
    }
  },

  async set(cacheKey, pendingEntry) {
    const client = getClient();
    if (!client) return;

    let resolvePending;
    const pending = new Promise(resolve => {
      resolvePending = resolve;
    });
    pendingSets.set(cacheKey, pending);

    try {
      const entry = await pendingEntry;
      const value = await streamToBase64(entry.value);
      await client.set(
        entryKey(cacheKey),
        {
          expire: entry.expire,
          revalidate: entry.revalidate,
          stale: entry.stale,
          tags: entry.tags,
          timestamp: entry.timestamp,
          value,
        },
        { ex: entry.expire },
      );
    } catch {
      // Cache writes should never break the response being generated.
    } finally {
      resolvePending();
      pendingSets.delete(cacheKey);
    }
  },

  async refreshTags() {},

  async getExpiration(tags) {
    const client = getClient();
    if (!client) return 0;

    try {
      return getExpirationFor(client, tags);
    } catch {
      return 0;
    }
  },

  async updateTags(tags) {
    const client = getClient();
    if (!client) return;

    const now = Date.now();
    try {
      const pipeline = client.pipeline();
      for (const tag of tags) {
        pipeline.set(tagKey(tag), now);
      }
      await pipeline.exec();
    } catch {
      // Missing invalidation is preferable to failing a server action.
    }
  },
};
