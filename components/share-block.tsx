'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  shareUrl: string;
};

export function ShareBlock({ shareUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try selecting the URL manually.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted dark:text-muted-dark min-w-0 truncate font-mono text-xs">{shareUrl}</div>
      <button
        onClick={copy}
        className="bg-ink text-paper dark:bg-paper dark:text-ink shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85"
      >
        {copied ? 'Copied' : 'Copy share link'}
      </button>
    </div>
  );
}
