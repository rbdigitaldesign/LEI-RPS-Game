
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

const trailerLines = [
  "In a world of quarterly reports and deadlines...",
  "...one decision rises above them all.",
  "The greatest show of tactical prowess LEI has ever seen...",
  "Stretch your phalanges.",
  "Flex your metacarpals.",
  "Are you ready to claim victory for your pod?",
];

type IntroTrailerProps = {
    onStartTournament: () => void;
    isProcessing: boolean;
};

export function IntroTrailer({ onStartTournament, isProcessing }: IntroTrailerProps) {
  const [index, setIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (index < trailerLines.length) {
      const timer = setTimeout(() => {
        setIndex(index + 1);
      }, 3000); // 3 seconds per line
      return () => clearTimeout(timer);
    } else {
        const buttonTimer = setTimeout(() => {
            setShowButton(true);
        }, 3000);
        return () => clearTimeout(buttonTimer);
    }
  }, [index]);

  return (
    <Card className="w-full max-w-2xl text-center bg-black/80 backdrop-blur-sm border-2 border-primary min-h-[280px] flex flex-col justify-center">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline text-accent">RPS Pod Battle</CardTitle>
            <CardDescription className="text-sm text-primary leading-relaxed">The ultimate rock, paper, scissors showdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
                {!showButton ? (
                     <motion.p
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="text-lg text-muted-foreground h-12 flex items-center justify-center"
                    >
                        {trailerLines[index]}
                    </motion.p>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                         <p className="text-muted-foreground text-xs">
                            LEI Monthly Meeting — 27th August 2025
                        </p>
                        <Button size="lg" onClick={onStartTournament} className="w-full text-lg mt-4" disabled={isProcessing}>
                            {isProcessing ? 'Loading...' : 'Start Tournament'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </CardContent>
    </Card>
  );
}
