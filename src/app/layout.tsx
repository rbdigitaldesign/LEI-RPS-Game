
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Space_Grotesk, Press_Start_2P } from 'next/font/google';

export const metadata: Metadata = {
  title: 'RPS Pod Showdown',
  description: 'The ultimate rock, paper, scissors showdown',
};

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-press-start-2p',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preload" as="image" href="https://i.imgur.com/cHVMAki.jpeg" />
      </head>
      <body className={`${spaceGrotesk.variable} ${pressStart2P.variable} font-sans antialiased min-h-screen flex flex-col`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
