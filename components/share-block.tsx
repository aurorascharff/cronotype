'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  bioLine: string;
};

export function ShareBlock({ bioLine }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bioLine);
      setCopied(true);
      toast.success('Copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Try selecting it manually.");
    }
  }

  return (
    <div className="border-border dark:border-border-dark dark:bg-ink-2/40 flex items-center gap-2 rounded-xl border bg-white/60 p-2 backdrop-blur-sm">
      <code className="dark:text-paper flex-1 truncate px-3 py-1.5 font-mono text-sm">{bioLine}</code>
      <button
        onClick={copy}
        className="bg-ink text-paper dark:bg-paper dark:text-ink shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-85"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
