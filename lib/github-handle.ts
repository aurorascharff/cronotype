const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, '').replace(/\/+$/, '').toLowerCase();
}

export function isValidGitHubHandle(handle: string): boolean {
  return GITHUB_HANDLE_RE.test(handle);
}
