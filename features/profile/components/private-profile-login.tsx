import { privateOAuthConfigured } from '@/features/profile/profile-private-queries';

export function PrivateProfileIntro() {
  return (
    <section className="space-y-4">
      <p className="text-muted dark:text-muted-dark text-sm">Private cronotype</p>
      <h1 className="tracking-tightest text-4xl leading-tight font-semibold sm:text-5xl">
        Include private commits once.
      </h1>
      <p className="text-muted dark:text-muted-dark max-w-xl text-sm sm:text-base">
        Sign in with GitHub, compute a 90-day cronotype using commits your account can see, then keep the result only in
        this browser long enough to view or download it. GitHub&apos;s classic private repo scope is broad; Cronotype
        only makes read requests and does not save the token.
      </p>
      <p className="text-muted dark:text-muted-dark max-w-xl text-sm">
        After you download the card, revoke the GitHub authorization from your GitHub settings.
      </p>
    </section>
  );
}

export function PrivateProfileIntroSkeleton() {
  return (
    <section className="space-y-4">
      <div className="skeleton h-4 w-28 rounded-full" />
      <div className="skeleton h-11 w-full max-w-md rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-full max-w-xl rounded-full" />
        <div className="skeleton h-4 w-4/5 max-w-xl rounded-full" />
      </div>
    </section>
  );
}

export function PrivateProfileLoginCard() {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">GitHub OAuth</h2>
          <p className="text-muted dark:text-muted-dark text-sm">
            Requests GitHub&apos;s classic private repo scope so commit search can include private repositories. Revoke
            access when you&apos;re done.
          </p>
        </div>
        {privateOAuthConfigured() ? (
          // OAuth starts with a route-handler redirect, so this should be a document navigation.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/api/github/private/login"
            className="bg-brand text-on-brand dark:text-ink inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-cyan-300/60 px-4 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_1px_2px_rgba(0,0,0,0.20)] ring-1 ring-cyan-400/25 transition-[border-color,box-shadow,transform] hover:border-cyan-200/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.46),0_4px_14px_rgba(6,182,212,0.20)] active:translate-y-px dark:border-cyan-200/50 dark:ring-cyan-200/20"
          >
            Sign in with GitHub
          </a>
        ) : (
          <span className="text-muted dark:text-muted-dark rounded-md border border-black/10 px-3 py-2 text-xs dark:border-white/10">
            OAuth env missing
          </span>
        )}
      </div>
    </div>
  );
}

export function PrivateProfileLoginCardSkeleton() {
  return (
    <div className="dark:bg-ink-2 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10" aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton h-5 w-32 rounded-full" />
          <div className="skeleton h-4 w-72 max-w-full rounded-full" />
        </div>
        <div className="skeleton h-10 w-40 shrink-0 rounded-md" />
      </div>
    </div>
  );
}

export function PrivateProfileAuthError({ error }: { error: string }) {
  const message =
    error === 'oauth-env'
      ? 'Add GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET to try this.'
      : error === 'oauth-state'
        ? 'GitHub sign-in expired. Try again.'
        : error === 'github-rate-limit'
          ? 'GitHub is rate limiting requests right now. Wait a minute, then try again.'
          : 'GitHub could not complete the private run. Try again in a moment.';

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
      {message}
    </div>
  );
}
