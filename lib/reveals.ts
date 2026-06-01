import 'server-only';
import { Redis } from '@upstash/redis';

// No-ops when KV_REST_API_URL / KV_REST_API_TOKEN are missing - callers treat
// an empty list as "show the seed set" rather than "show nothing".

const REVEALS_KEY = 'reveals:v1';
const MAX_REVEALS = 100;

function getClient(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });
}

export async function recordReveal(login: string): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  const lower = login.toLowerCase();
  await kv.zadd(REVEALS_KEY, { member: lower, score: Date.now() });
  await kv.zremrangebyrank(REVEALS_KEY, 0, -MAX_REVEALS - 1);
}

export async function listReveals(limit: number): Promise<string[]> {
  const kv = getClient();
  if (!kv) return [];
  const raw = await kv.zrange<string[]>(REVEALS_KEY, 0, limit - 1, { rev: true });
  return raw ?? [];
}
