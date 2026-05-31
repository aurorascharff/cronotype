import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from 'sonner';
import { SiteHeader } from '@/components/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { color: '#fafaf7', media: '(prefers-color-scheme: light)' },
    { color: '#0a0a0a', media: '(prefers-color-scheme: dark)' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  description: 'A diagnosis for your commit habits. One field. One verdict. One screenshot.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'),
  ),
  openGraph: {
    description: 'What kind of developer are you? Find out in one chart.',
    siteName: 'Cronotype',
    title: 'Cronotype — your commit fingerprint',
    type: 'website',
  },
  title: {
    default: 'Cronotype — your commit fingerprint',
    template: '%s · Cronotype',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="bg-paper text-ink dark:bg-ink dark:text-paper flex min-h-[100dvh] flex-col antialiased">
        <ThemeProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
          <SiteFooter />
          <Toaster theme="system" position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="text-muted dark:text-muted-dark flex flex-col items-center justify-center gap-2 text-center text-sm sm:flex-row sm:gap-6">
        <p>
          By{' '}
          <a
            href="https://github.com/aurorascharff"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-ink dark:hover:text-paper underline-offset-2 transition-colors hover:underline"
          >
            Aurora Scharff
          </a>
        </p>
        <span aria-hidden className="hidden sm:inline">·</span>
        <a
          href="https://github.com/aurorascharff/cronotype"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-ink dark:hover:text-paper inline-flex items-center gap-1.5 underline-offset-2 transition-colors hover:underline"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
        <span aria-hidden className="hidden sm:inline">·</span>
        <p>
          Inspired by{' '}
          <a
            href="https://areyougoingexponential.com"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-ink dark:hover:text-paper underline-offset-2 transition-colors hover:underline"
          >
            Are You Going Exponential
          </a>
        </p>
      </div>
    </footer>
  );
}
