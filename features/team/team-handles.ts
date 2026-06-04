import { isValidGitHubHandle, normalizeHandle } from '@/lib/github-handle';

export type ParsedTeamHandles = {
  handles: string[];
  invalid: string[];
};

export function parseTeamHandles(value: string | string[] | undefined): ParsedTeamHandles {
  const raw = Array.isArray(value) ? value.join(',') : (value ?? '');
  const seen = new Set<string>();
  const handles: string[] = [];
  const invalid: string[] = [];

  for (const part of raw.split(/[\s,]+/)) {
    const handle = normalizeHandle(part);
    if (!handle) continue;
    if (!isValidGitHubHandle(handle)) {
      invalid.push(part.trim());
      continue;
    }
    if (seen.has(handle)) continue;
    seen.add(handle);
    handles.push(handle);
  }

  return { handles, invalid };
}

export function serializeTeamHandles(handles: string[]): string {
  return handles.join(',');
}
