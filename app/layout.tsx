import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Load the custom Hebrew font copied from clips.Revolution
const abraham = localFont({
  src: './fonts/Abraham-Regular.ttf',
  variable: '--font-sans',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
});

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
    <html lang="he" dir="rtl" className={abraham.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
