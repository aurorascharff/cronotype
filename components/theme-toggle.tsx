'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="border-border dark:border-border-dark hover:bg-ink hover:text-paper dark:hover:bg-paper dark:hover:text-ink inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-transparent transition-colors"
    >
      <span aria-hidden className="text-base">
        {mounted ? (isDark ? '☾' : '☀') : ' '}
      </span>
    </button>
  );
}
