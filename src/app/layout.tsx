
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoHub',
  description: 'Your partner in sustainability.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.svg',
    apple: '/apple-touch-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="EcoHub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EcoHub" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#141a14" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                {children}
            </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
