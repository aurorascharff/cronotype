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
      <p className="text-muted dark:text-muted-dark text-center text-sm">
        Inspired by{' '}
        <a
          href="https://areyougoingexponential.com"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-ink dark:hover:text-paper underline-offset-2 transition-colors hover:underline"
        >
          Are You Going Exponential
        </a>
        .
      </p>
    </footer>
  );
}
