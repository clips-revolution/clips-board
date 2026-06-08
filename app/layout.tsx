import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'clips.board — מחולל סטוריבורד Ai',
  description: 'מחולל לוחות תמונות ותסריטים חזותיים מבוסס בינה מלאכותית להפקות וידאו - מבית clips.Revolution.',
  icons: {
    icon: '/favicon-logo.png',
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
