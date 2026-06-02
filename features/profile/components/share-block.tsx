'use client';

import { Check, Download, Link2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { BlueskyIcon, XIcon } from '@/components/ui/icons';

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
          {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
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
        <Download className="h-3.5 w-3.5" />
        <span className={label}>{downloading ? 'Downloading' : 'Download'}</span>
      </button>
    </div>
  );
}

export function ShareUrl({ shareUrl }: { shareUrl: string }) {
  const display = shareUrl.replace(/^https?:\/\//, '');
  return (
    <span className="text-muted dark:text-muted-dark block max-w-full min-w-0 truncate font-mono text-xs tracking-tight sm:text-sm">
      {display}
    </span>
  );
}
