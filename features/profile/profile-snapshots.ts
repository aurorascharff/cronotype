import 'server-only';

import { Redis } from '@upstash/redis';
import type { CronotypeResult } from '@/types/cronotype';
import type { MonthlyHistory } from './profile-queries';

const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 30;

function getClient(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    token: process.env.KV_REST_API_TOKEN,
    url: process.env.KV_REST_API_URL,
  });
}

export async function readCronotypeSnapshot(handle: string): Promise<CronotypeResult | null> {
  const kv = getClient();
  if (!kv) return null;
  try {
    return await kv.get<CronotypeResult>(cronotypeSnapshotKey(handle.toLowerCase()));
  } catch {
    return null;
  }
}

export async function writeCronotypeSnapshot(handle: string, result: CronotypeResult): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  try {
    await kv.set(cronotypeSnapshotKey(handle.toLowerCase()), result, { ex: SNAPSHOT_TTL_SECONDS });
  } catch {
    // Snapshots are a fallback for rate-limit revalidation failures; losing one should not fail the render.
  }
}

export async function readHistorySnapshot(handle: string): Promise<MonthlyHistory | null> {
  const kv = getClient();
  if (!kv) return null;
  try {
    return await kv.get<MonthlyHistory>(historySnapshotKey(handle.toLowerCase()));
  } catch {
    return null;
  }
}

export async function writeHistorySnapshot(handle: string, history: MonthlyHistory): Promise<void> {
  const kv = getClient();
  if (!kv) return;
  try {
    await kv.set(historySnapshotKey(handle.toLowerCase()), history, { ex: SNAPSHOT_TTL_SECONDS });
  } catch {
    // Snapshots are a fallback for rate-limit revalidation failures; losing one should not fail the render.
  }
}

function cronotypeSnapshotKey(handle: string) {
  return `profile-snapshot:v1:cronotype:${handle}`;
}

function historySnapshotKey(handle: string) {
  return `profile-snapshot:v1:history:${handle}`;
}
