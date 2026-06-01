'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  handle: string;
};

export function DownloadTimeline({ handle }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/${handle}/timeline-image`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cronotype-${handle}-timeline.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download the timeline. Try again in a moment.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={downloading}
      className="text-muted/70 dark:text-muted-dark/70 hover:text-ink dark:hover:text-paper inline-flex min-w-24 items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-[10.5px] tracking-wide uppercase transition-colors hover:border-black/10 disabled:opacity-60 dark:hover:border-white/10"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-2.5 w-2.5"
        aria-hidden
      >
        <path d="M12 4v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M5 20h14" />
      </svg>
      <span className="inline-block min-w-18 text-left">{downloading ? 'Downloading' : 'Download'}</span>
    </button>
  );
}
