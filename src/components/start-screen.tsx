
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Header } from './header';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type StartScreenProps = {
    onStartTournament: () => void;
    isProcessing: boolean;
};

export function StartScreen({ onStartTournament, isProcessing }: StartScreenProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartClick = () => {
    setIsLoading(true);
    setIsMuted(false); // Unmute when loading starts

    setTimeout(() => {
      onStartTournament();
    }, 4000); // 4-second loading time
  };

  if (!isClient) {
    return null;
  }
  
  const soundCloudSrc = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1674907137&color=%23ff5500&auto_play=${!isMuted}&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;

  return (
    <div className="flex flex-col min-h-screen bg-hero-pattern bg-cover bg-center bg-fixed">
      <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
            <Link href="/teams">View Pods</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9"
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
              <span className="sr-only">Toggle Music</span>
            </Button>
        </div>
      </Header>
      <main className="flex-grow flex items-center justify-center p-4">
        {isClient && (
          <iframe
            width="0"
            height="0"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={soundCloudSrc}
            style={{ display: 'none' }}
          ></iframe>
        )}
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full"
        >
            <Card className="w-full max-w-4xl text-center bg-black/40 backdrop-blur-sm border-0 shadow-none flex flex-col justify-center items-center mx-auto min-h-[400px]">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-4 text-white font-sans"
                  >
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                    <p className="text-2xl tracking-widest animate-pulse">LOADING TOURNAMENT...</p>
                  </motion.div>
                ) : (
                  <>
                  <CardHeader className="p-4">
                      <CardTitle
                          className="text-5xl md:text-8xl font-black font-headline text-accent tracking-wider uppercase"
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                      >
                          RPS Pod Battle
                      </CardTitle>
                      <CardDescription
                          className="text-lg md:text-2xl text-primary leading-relaxed mt-2 font-sans"
                          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                      >
                          The ultimate rock, paper, scissors showdown
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-8">
                      <Button
                        onClick={handleStartClick}
                        className="w-48 h-48 rounded-full text-lg font-black font-body text-white bg-red-600 hover:bg-red-700 border-8 border-red-800 shadow-[0_10px_0_0_#9B2C2C] active:shadow-none active:translate-y-2 transition-all duration-150 ease-in-out flex flex-col leading-tight"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Loading...' : (
                          <>
                              <span>Press</span>
                              <span>Start</span>
                          </>
                        )}
                      </Button>
                  </CardContent>
                  </>
                )}
            </Card>
        </motion.div>
      </main>
    </div>
  );
}
