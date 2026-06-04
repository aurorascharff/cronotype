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

export function parseTeamName(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function teamUrl({ handles, name }: { handles: string[]; name?: string }): string {
  const params = new URLSearchParams();
  const serialized = serializeTeamHandles(handles);
  if (serialized) params.set('handles', serialized);
  if (name) params.set('name', name);
  const query = params.toString();
  return query ? `/team?${query}` : '/team';
}
