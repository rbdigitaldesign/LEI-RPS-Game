import { motion } from 'framer-motion';
import type { Pod } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy } from 'lucide-react';

type MatchWinnerProps = {
    winner: Pod;
};

export function MatchWinner({ winner }: MatchWinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="text-center shadow-2xl bg-background/95 border-primary border-4">
          <CardHeader>
             <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mx-auto"
            >
                <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-lg" />
            </motion.div>
            <p className="text-xl font-medium text-primary uppercase tracking-widest">Match Winner</p>
            <CardTitle className="text-6xl font-black font-headline tracking-tighter">{winner.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-secondary flex items-center justify-center">
              <span className="text-8xl">{winner.emoji}</span>
            </div>
            <p className="text-2xl text-muted-foreground">Advances to the next round!</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
