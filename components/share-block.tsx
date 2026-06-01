'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  shareUrl: string;
  archetypeName: string;
  accent: string;
  handle: string;
  className?: string;
};

const SHARE_TAGLINE = 'Find your developer type';

export function ShareActions({ shareUrl, archetypeName, accent, handle, className }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied · pastes as a preview card');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try selecting the URL manually.");
    }
  }

  async function downloadImage() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/${handle}/opengraph-image`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cronotype-${handle}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download the image. Try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  function shareToX() {
    const text = `I'm a ${archetypeName}. ${SHARE_TAGLINE}:`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  }

  function shareToBluesky() {
    const text = `I'm a ${archetypeName}. ${SHARE_TAGLINE}: ${shareUrl}`;
    const intent = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  }

  const base =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white/85 px-2.5 text-[11px] font-medium text-ink backdrop-blur-sm transition-colors hover:bg-white max-[520px]:w-9 max-[520px]:px-0 dark:border-white/15 dark:bg-white/[0.06] dark:text-paper dark:hover:bg-white/[0.12]';
  const label = 'max-[520px]:sr-only';

  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      <button type="button" onClick={shareToX} aria-label="Share on X" className={base}>
        <XIcon className="h-3.5 w-3.5" />
        <span className={label}>Share</span>
      </button>
      <button type="button" onClick={shareToBluesky} aria-label="Share on Bluesky" className={base}>
        <BlueskyIcon className="h-3.5 w-3.5" />
        <span className={label}>Share</span>
      </button>
      <button type="button" onClick={copyLink} aria-label="Copy link" className={base}>
        <span style={{ color: accent }} className="inline-flex">
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        </span>
        <span className={label}>{copied ? 'Copied' : 'Copy link'}</span>
      </button>
      <button
        type="button"
        onClick={downloadImage}
        disabled={downloading}
        aria-label="Download image"
        className={`${base} disabled:opacity-60`}
      >
        <DownloadIcon className="h-3.5 w-3.5" />
        <span className={label}>{downloading ? 'Downloading' : 'Download'}</span>
      </button>
    </div>
  );
}

export function ShareUrl({ shareUrl }: { shareUrl: string }) {
  const display = shareUrl.replace(/^https?:\/\//, '');
  return (
    <span className="text-muted dark:text-muted-dark block min-w-0 max-w-full truncate font-mono text-xs tracking-tight sm:text-sm">
      {display}
    </span>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 57" fill="currentColor" className={className} aria-hidden>
      <path d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55 64-3.268 55.421-.182 50.127 3.805Z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}
