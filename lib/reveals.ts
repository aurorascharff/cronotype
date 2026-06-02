import 'server-only';

import { Redis } from '@upstash/redis';
import { cacheLife, cacheTag } from 'next/cache';

// No-ops when KV_REST_API_URL / KV_REST_API_TOKEN are missing. Callers treat
// missing reveal state as locked and an empty featured list as unavailable.

const REVEAL_KEY_PREFIX = 'reveal:v1';
const TIMELINE_LOADED_KEY_PREFIX = 'timeline-loaded:v1';
const FEATURED_REVEALS_KEY = 'reveals:featured:v1';
const MAX_REVEALS = 10_000;

function getClient(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });
}

export async function recordReveal(handle: string): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  const normalized = handle.toLowerCase();
  await kv.set(revealKey(normalized), normalized);
}

export async function recordFeaturedReveal(handle: string): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  const normalized = handle.toLowerCase();
  await kv.zadd(FEATURED_REVEALS_KEY, { member: normalized, score: Date.now() });
  await kv.zremrangebyrank(FEATURED_REVEALS_KEY, 0, -MAX_REVEALS - 1);
}

export async function recordTimelineLoaded(handle: string): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  const normalized = handle.toLowerCase();
  await kv.set(timelineLoadedKey(normalized), normalized);
}

export async function listFeaturedReveals(limit = MAX_REVEALS): Promise<string[]> {
  return listFeaturedRevealsCached(limit);
}

async function listFeaturedRevealsCached(limit: number): Promise<string[]> {
  'use cache: remote';
  cacheTag('reveals');
  cacheLife('cronotype');

  const kv = getClient();
  if (!kv) return [];
  const raw = await kv.zrange<string[]>(FEATURED_REVEALS_KEY, 0, limit - 1, { rev: true });
  return raw ?? [];
}

export async function hasBeenRevealed(handle: string): Promise<boolean> {
  return hasBeenRevealedCached(handle.toLowerCase());
}

export async function hasTimelineLoaded(handle: string): Promise<boolean> {
  return hasTimelineLoadedCached(handle.toLowerCase());
}

async function hasTimelineLoadedCached(handle: string): Promise<boolean> {
  'use cache: remote';
  cacheTag(`timeline-loaded-${handle}`);
  cacheLife('cronotype');

  const kv = getClient();
  if (!kv) return false;
  const value = await kv.get(timelineLoadedKey(handle));
  return value !== null;
}

async function hasBeenRevealedCached(handle: string): Promise<boolean> {
  'use cache: remote';
  cacheTag(`reveal-${handle}`);
  cacheLife('cronotype');

  const kv = getClient();
  if (!kv) return false;
  const value = await kv.get(revealKey(handle));
  return value !== null;
}

function revealKey(handle: string): string {
  return `${REVEAL_KEY_PREFIX}:${handle}`;
}

function timelineLoadedKey(handle: string): string {
  return `${TIMELINE_LOADED_KEY_PREFIX}:${handle}`;
}
