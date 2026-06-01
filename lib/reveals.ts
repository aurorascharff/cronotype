import 'server-only';
import { Redis } from '@upstash/redis';

/**
 * Backing store for "Recently revealed" - every profile-page reveal writes
 * the login here, the homepage reads from it.
 *
 * Uses Upstash Redis via the Vercel KV integration (`KV_REST_API_URL` +
 * `KV_REST_API_TOKEN` env vars set by `vercel link` once you add the store
 * in the dashboard).
 *
 * Graceful fallback: when env vars are missing (e.g. local dev without KV
 * provisioned), all functions are no-ops and `list()` returns []. Callers
 * should treat an empty list as "show the seed set" rather than "show nothing".
 */

const REVEALS_KEY = 'reveals:v1';
const MAX_REVEALS = 100;

function getClient(): Redis | null {
 // Lazy so unit tests / build don't fail on missing env.
 if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
 return new Redis({
  token: process.env.KV_REST_API_TOKEN,
  url: process.env.KV_REST_API_URL,
 });
}

/** Record a reveal. Safe to call concurrently. */
export async function recordReveal(login: string): Promise<void> {
 const kv = getClient();
 if (!kv) return;
 const lower = login.toLowerCase();
 await kv.zadd(REVEALS_KEY, { member: lower, score: Date.now() });
 // Keep only the most recent MAX_REVEALS entries.
 await kv.zremrangebyrank(REVEALS_KEY, 0, -MAX_REVEALS - 1);
}

/** List recent reveals, most recent first. */
export async function listReveals(limit: number): Promise<string[]> {
 const kv = getClient();
 if (!kv) return [];
 const raw = await kv.zrange<string[]>(REVEALS_KEY, 0, limit - 1, { rev: true });
 return raw ?? [];
}
