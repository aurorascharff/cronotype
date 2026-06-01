import 'server-only';
import { Redis } from '@upstash/redis';

// No-ops when KV_REST_API_URL / KV_REST_API_TOKEN are missing - callers treat
// missing reveal state as locked and an empty featured list as unavailable.

const REVEAL_KEY_PREFIX = 'reveal:v1';
const FEATURED_REVEALS_KEY = 'reveals:featured:v1';
const MAX_REVEALS = 10_000;

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
  await kv.set(revealKey(lower), lower);
}

export async function recordFeaturedReveal(login: string): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  const lower = login.toLowerCase();
  await kv.zadd(FEATURED_REVEALS_KEY, { member: lower, score: Date.now() });
  await kv.zremrangebyrank(FEATURED_REVEALS_KEY, 0, -MAX_REVEALS - 1);
}

export async function listFeaturedReveals(limit: number): Promise<string[]> {
  const kv = getClient();
  if (!kv) return [];
  const raw = await kv.zrange<string[]>(FEATURED_REVEALS_KEY, 0, limit - 1, { rev: true });
  return raw ?? [];
}

export async function hasBeenRevealed(login: string): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  const value = await kv.get(revealKey(login.toLowerCase()));
  return value !== null;
}

function revealKey(login: string): string {
  return `${REVEAL_KEY_PREFIX}:${login}`;
}
