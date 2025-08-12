
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'RPS Pod Battle',
  description: 'The ultimate rock, paper, scissors showdown',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(45 50 50)'><path d='M45 10 h10 v50 h-10 z' fill='%23FF69B4' /><path d='M35 60 h30 v10 h-30 z' fill='%23FF69B4' /><path d='M45 70 h10 v10 h-10 z' fill='%23FF69B4' /></g><g transform='rotate(-45 50 50)'><path d='M45 10 h10 v50 h-10 z' fill='%23800080' /><path d='M35 60 h30 v10 h-30 z' fill='%23800080' /><path d='M45 70 h10 v10 h-10 z' fill='%23800080' /></g></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="preload" as="image" href="https://i.imgur.com/DoA6NkS.png" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
