import { notFound } from 'next/navigation';
import { HeroCard } from '@/features/profile/components/hero-card';
import { CronotypeProfileSkeleton } from '@/features/profile/components/cronotype-profile';
import { DownloadPrivateCard } from '@/features/profile/components/download-private-card';
import { getPrivateResultCookie } from '@/features/profile/profile-private-queries';
import { ARCHETYPES } from '@/lib/archetypes';
import { formatCount } from '@/lib/format';

export async function PrivateProfileCardSection() {
  const result = await getPrivateResultCookie();
  if (!result) notFound();
  const archetypeId = result.archetypeId as keyof typeof ARCHETYPES;
  const archetype = ARCHETYPES[archetypeId];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Private cronotype</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted/70 dark:text-muted-dark/70 text-[10.5px] tracking-wide uppercase">
            {formatCount(result.stats.total)} private-visible signal commits
          </span>
          <DownloadPrivateCard handle={result.profile.login} />
        </div>
      </header>
      <HeroCard profile={result.profile} archetype={archetype} stats={result.stats} percentile={result.percentile} />
      <PrivateProfileSecurityNotice />
    </section>
  );
}

export function PrivateProfileCardSectionSkeleton() {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold tracking-tight">Private cronotype</h1>
        <div className="skeleton h-3 w-36 rounded-full" aria-hidden />
      </header>
      <CronotypeProfileSkeleton />
    </section>
  );
}

function PrivateProfileSecurityNotice() {
  return (
    <div className="text-muted dark:text-muted-dark space-y-2 text-sm">
      <p>
        This is a local, short-lived result from commits visible to your GitHub token. The token is not stored, and this
        page is not shareable.
      </p>
      <p>
        After downloading the card, revoke the authorization in{' '}
        <a
          href="https://github.com/settings/apps/authorizations"
          target="_blank"
          rel="noreferrer noopener"
          className="text-ink dark:text-paper underline-offset-2 transition-colors hover:underline"
        >
          GitHub App authorizations
        </a>{' '}
        or{' '}
        <a
          href="https://github.com/settings/applications"
          target="_blank"
          rel="noreferrer noopener"
          className="text-ink dark:text-paper underline-offset-2 transition-colors hover:underline"
        >
          OAuth app settings
        </a>
        .
      </p>
    </div>
  );
}
