'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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
    <Button
      type="button"
      onClick={download}
      disabled={downloading}
      icon={<DownloadIcon />}
      iconPosition="start"
      size="xs"
      variant="secondary"
    >
      <span className="inline-block min-w-18 text-left">{downloading ? 'Downloading' : 'Download'}</span>
    </Button>
  );
}

function DownloadIcon() {
  return (
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
  );
}
