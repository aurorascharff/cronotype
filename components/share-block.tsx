'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  shareUrl: string;
  accent: string;
  className?: string;
};

export function ShareButton({ shareUrl, accent, className }: Props) {
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
    <button
      type="button"
      onClick={copy}
      aria-label="Copy share link"
      className={`text-ink dark:text-paper group inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] ${className ?? ''}`}
    >
      <span style={{ color: accent }} className="inline-flex">
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
      </span>
      <span>{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  );
}

export function ShareUrl({ shareUrl }: { shareUrl: string }) {
  const display = shareUrl.replace(/^https?:\/\//, '');
  return (
    <div className="text-muted/70 dark:text-muted-dark/70 px-1 font-mono text-[11px] tracking-tight">
      {display}
    </div>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

