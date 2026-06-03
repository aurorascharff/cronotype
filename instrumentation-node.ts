function isGitHubRateLimitRejection(reason: unknown): boolean {
  if (typeof reason !== 'object' || reason === null) return false;

  const error = reason as { message?: unknown; status?: unknown };
  const status = error.status;
  const message = typeof error.message === 'string' ? error.message : '';

  return (
    (status === 403 || status === 429) &&
    (message.includes('GitHub rate limit') || message.includes('GitHub blocked the request'))
  );
}

process.on('unhandledRejection', reason => {
  if (isGitHubRateLimitRejection(reason)) {
    process.stderr.write(
      `[instrumentation] GitHub rate-limit rejection escaped async revalidation: ${String(reason)}\n`,
    );
    return;
  }

  throw reason instanceof Error ? reason : new Error(`Unhandled rejection: ${String(reason)}`);
});

export {};
