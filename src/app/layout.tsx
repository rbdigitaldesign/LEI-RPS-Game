
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Space_Grotesk } from 'next/font/google';

export const metadata: Metadata = {
  title: 'RPS Pod Showdown',
  description: 'The ultimate rock, paper, scissors showdown',
};

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
