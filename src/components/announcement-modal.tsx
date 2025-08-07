
'use client';

import { motion } from 'framer-motion';
import type { Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy } from 'lucide-react';

type AnnouncementModalProps = {
    match: Match;
};

export function AnnouncementModal({ match }: AnnouncementModalProps) {
  if (!match.winner) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="text-center bg-card border-accent border-4 shadow-2xl shadow-accent/20">
          <CardHeader>
             <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mx-auto"
            >
                <Trophy className="w-16 h-16 text-yellow-500" />
            </motion.div>
            <p className="text-xl font-medium text-accent uppercase tracking-widest">Match Winner</p>
            <CardTitle className="text-6xl font-black font-headline tracking-tight text-primary">{match.winner.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
              <span className="text-8xl">{match.winner.emoji}</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-semibold">Defeated</p>
                <div className="relative w-24 h-24 border-2 border-destructive bg-background flex items-center justify-center">
                    <span className="text-5xl grayscale">{match.loser?.emoji}</span>
                </div>
                <p className="text-2xl font-semibold capitalize text-destructive tracking-wide">{match.loser?.name}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
