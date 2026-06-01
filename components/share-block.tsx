'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  shareUrl: string;
  archetypeName: string;
  accent: string;
  className?: string;
};

const SHARE_TAGLINE = 'Find your developer type';

export function ShareActions({ shareUrl, archetypeName, accent, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try selecting the URL manually.");
    }
  }

  function shareToX() {
    const text = `I'm a ${archetypeName}. ${SHARE_TAGLINE}:`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  }

  const base =
    'inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:text-paper dark:hover:bg-white/[0.12]';

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <button type="button" onClick={shareToX} aria-label="Share on X" className={base}>
        <XIcon className="h-3.5 w-3.5" />
        <span>Share</span>
      </button>
      <button type="button" onClick={copyLink} aria-label="Copy link" className={base}>
        <span style={{ color: accent }} className="inline-flex">
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        </span>
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>
    </div>
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
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

