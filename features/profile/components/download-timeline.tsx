'use client';

import { Download } from 'lucide-react';
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
      isPending={downloading}
      icon={<Download className="h-2.5 w-2.5" />}
      iconPosition="start"
      size="xs"
      variant="secondary"
    >
      <span className="inline-block min-w-18 text-left">Download</span>
    </Button>
  );
}
