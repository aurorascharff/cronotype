'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  shareUrl: string;
  accent: string;
  accent2: string;
  className?: string;
};

export function ShareButton({ shareUrl, accent, accent2, className }: Props) {
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
      className={`group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_4px_18px_-4px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent2}, ${accent})`,
      }}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <LinkIcon className="h-3.5 w-3.5" />
      )}
      <span>{copied ? 'Copied' : 'Copy share link'}</span>
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

