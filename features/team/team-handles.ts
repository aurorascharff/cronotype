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
  const serialized = serializeTeamHandles(handles);
  const parts: string[] = [];
  if (serialized) parts.push(`handles=${serialized}`);
  if (name) parts.push(`name=${encodeTeamQueryValue(name)}`);
  return parts.length > 0 ? `/team?${parts.join('&')}` : '/team';
}

export function teamImageUrl({
  handles,
  name,
  variant,
}: {
  handles: string[];
  name?: string;
  variant?: 'download';
}): string {
  const serialized = serializeTeamHandles(handles);
  const parts: string[] = [];
  if (variant) parts.push(`variant=${variant}`);
  if (serialized) parts.push(`handles=${serialized}`);
  if (name) parts.push(`name=${encodeTeamQueryValue(name)}`);
  return parts.length > 0 ? `/team/image?${parts.join('&')}` : '/team/image';
}

function encodeTeamQueryValue(value: string) {
  return encodeURIComponent(value).replaceAll('%20', '+');
}
