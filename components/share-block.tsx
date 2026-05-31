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
      toast.success('Link copied — paste it anywhere to share your chart');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try selecting it manually.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="border-border dark:border-border-dark dark:bg-ink-2/40 flex items-center gap-2 rounded-xl border bg-white/60 p-2 backdrop-blur-sm">
        <code className="dark:text-paper flex-1 truncate px-3 py-2 font-mono text-sm">{shareUrl}</code>
        <button
          onClick={copy}
          className="bg-ink text-paper dark:bg-paper dark:text-ink shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="text-muted dark:text-muted-dark px-1 text-xs">
        Paste anywhere to share — Twitter, Slack, iMessage all unfurl into your chart.
      </p>
    </div>
  );
}
