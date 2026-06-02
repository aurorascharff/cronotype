import { notFound } from 'next/navigation';
import { isValidGitHubHandle } from '@/lib/github-handle';
import { hasBeenRevealed } from '@/lib/reveals';
import { CronotypeProfile, CronotypeProfileSkeleton } from './cronotype-profile';
import { RegenerateButton } from './regenerate-button';
import { RevealGate } from './reveal-gate';

type Props = {
  handle: string;
};

export async function ProfileCardSection({ handle: rawHandle }: Props) {
  const handle = rawHandle.toLowerCase();
  if (!isValidGitHubHandle(handle)) notFound();

  const revealed = await hasBeenRevealed(handle);
  if (!revealed) return <RevealGate handle={handle} />;

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
        <RegenerateButton handle={handle} />
      </header>
      <CronotypeProfile handle={handle} />
    </section>
  );
}

export function ProfileCardSectionSkeleton() {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
        <div className="skeleton h-8 w-28 rounded-lg" aria-hidden />
      </header>
      <CronotypeProfileSkeleton />
    </section>
  );
}
