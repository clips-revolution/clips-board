import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'clips.board — מחולל סטוריבורד Ai',
  description: 'מחולל לוחות תמונות ותסריטים חזותיים מבוסס בינה מלאכותית להפקות וידאו - מבית clips.Revolution.',
    icons: [
    { rel: 'icon', url: '/favicon-v2.ico' },
    { rel: 'icon', url: '/favicon-48-v2.png', sizes: '48x48', type: 'image/png' },
    { rel: 'icon', url: '/favicon-32-v2.png', sizes: '32x32', type: 'image/png' },
    { rel: 'icon', url: '/favicon-192-v2.png', sizes: '192x192', type: 'image/png' },
    { rel: 'icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/favicon-512-v2.png', sizes: '512x512', type: 'image/png' },
  ],

      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    apple: '/favicon-logo.png',
  },
  openGraph: {
    images: ['https://clipsrevolution.com/social-preview.png'],
  },
  twitter: {
    images: ['https://clipsrevolution.com/social-preview.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
