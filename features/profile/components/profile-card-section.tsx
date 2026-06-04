import { notFound } from 'next/navigation';
import { isValidGitHubHandle } from '@/lib/github-handle';
import { CronotypeProfile, CronotypeProfileSkeleton } from './cronotype-profile';

type Props = {
  handle: string;
};

export async function ProfileCardSection({ handle: rawHandle }: Props) {
  const handle = rawHandle.toLowerCase();
  if (!isValidGitHubHandle(handle)) notFound();

  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
      </header>
      <CronotypeProfile handle={handle} />
    </section>
  );
}

export function ProfileCardSectionSkeleton() {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">The reveal</h2>
      </header>
      <CronotypeProfileSkeleton />
    </section>
  );
}
