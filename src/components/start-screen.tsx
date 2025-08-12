
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Header } from './header';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type StartScreenProps = {
    onStartTournament: () => void;
    isProcessing: boolean;
};

export function StartScreen({ onStartTournament, isProcessing }: StartScreenProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartClick = () => {
    setIsLoading(true);
    // Simulate loading time for the nostalgic progress bar
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setTimeout(onStartTournament, 500);
                return 100;
            }
            return prev + Math.random() * 20;
        });
    }, 300);
  };
  
  const soundCloudSrc = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1674907137&color=%23F44336&auto_play=${!isMuted}&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;

  return (
    <div className="flex flex-col min-h-screen bg-black/80">
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
      <main className="flex-grow flex items-center justify-center p-4 bg-hero-pattern bg-contain bg-center bg-no-repeat"
       >
        {isClient && !isMuted && (
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
            <Card className="w-full max-w-4xl text-center bg-background/25 backdrop-blur-sm flex flex-col justify-center items-center mx-auto min-h-[400px]">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-8 w-full max-w-md px-4"
                  >
                    <p className="text-2xl tracking-widest text-accent animate-pulse font-headline">LOADING TOURNAMENT...</p>
                    <div className="w-full bg-black/50 p-1 border-2 border-primary-foreground">
                        <Progress value={progress} className="h-6 [&>div]:bg-primary" />
                    </div>
                  </motion.div>
                ) : (
                  <>
                  <CardHeader className="p-4">
                      <CardTitle
                          className="text-5xl md:text-8xl font-black text-primary tracking-wider uppercase font-headline"
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                      >
                          RPS Pod Battle
                      </CardTitle>
                      <CardDescription
                          className="text-lg md:text-2xl text-accent leading-relaxed mt-2 font-headline"
                          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                      >
                          The ultimate rock, paper, scissors showdown
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-8">
                      <Button
                        onClick={handleStartClick}
                        className="w-48 h-48 rounded-full text-lg font-black text-primary-foreground bg-primary hover:bg-primary/90 border-8 border-red-800 shadow-[0_10px_0_0_#9B2C2C] active:shadow-none active:translate-y-2 transition-all duration-150 ease-in-out flex flex-col leading-tight font-headline"
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
