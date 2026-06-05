import { Suspense } from 'react';
import { Crossfade } from '@/components/ui/crossfade';
import { TeamForm } from '@/features/team/components/team-form';
import { TeamContent, TeamGallerySkeleton } from '@/features/team/components/team-gallery';
import { TeamRecents } from '@/features/team/components/team-recents';
import { parseTeamHandles, parseTeamName, teamImageUrl } from '@/features/team/team-handles';
import type { Metadata } from 'next';

export const unstable_prefetch = 'force-runtime';

export async function generateMetadata({ searchParams }: PageProps<'/team'>): Promise<Metadata> {
  const query = await searchParams;
  const { handles } = parseTeamHandles(query.handles);
  const name = parseTeamName(query.name);
  const title = name ? `${name} · Cronotype team` : 'Team gallery';
  const description =
    handles.length > 0
      ? `View ${handles.length} GitHub commit-time profiles in one Cronotype team gallery.`
      : 'Build a shareable Cronotype gallery from a list of GitHub handles.';
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000');
  const imageUrl = `${baseUrl.replace(/\/$/, '')}${teamImageUrl({ handles, name })}`;

  return {
    description,
    openGraph: {
      description,
      images:
        handles.length > 0
          ? [
              {
                alt: `${name || 'Team'} Cronotype gallery`,
                height: 630,
                url: imageUrl,
                width: 1200,
              },
            ]
          : [],
      title,
      type: 'website',
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: handles.length > 0 ? [imageUrl] : [],
      title,
    },
  };
}

export default function TeamPage({ searchParams }: PageProps<'/team'>) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="relative space-y-5 pt-2 sm:pt-6">
        <h1 className="tracking-tightest mx-auto max-w-xl text-center text-2xl leading-tight font-semibold sm:text-4xl">
          Team gallery
        </h1>
        <p className="text-muted dark:text-muted-dark mx-auto max-w-md text-center text-sm">
          Add GitHub handles, share the URL, and keep the gallery cached with the same profile cards.
        </p>
        <div className="mx-auto max-w-2xl">
          <TeamForm />
          <div className="h-20 pt-3">
            <TeamRecents />
          </div>
        </div>
      </section>
      <Suspense fallback={<TeamGallerySkeleton />}>
        <Crossfade>
          {searchParams.then(query => (
            <TeamContent handlesParam={query.handles} nameParam={query.name} />
          ))}
        </Crossfade>
      </Suspense>
    </div>
  );
}
