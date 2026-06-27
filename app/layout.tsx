import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import ToastProvider from '@/components/ui/ToastProvider';
import PreventRefresh from '@/components/ui/PreventRefresh';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'پیام‌رسان',
  description: 'اپلیکیشن پیام‌رسان لحظه‌ای',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'پیام‌رسان',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b141a',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="پیام‌رسان" />
        <meta name="msapplication-TileColor" content="#0b141a" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body>
        <ToastProvider />
        <PreventRefresh />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}