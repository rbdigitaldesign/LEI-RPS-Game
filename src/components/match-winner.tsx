import { motion } from 'framer-motion';
import type { Pod, Move } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Handshake } from 'lucide-react';
import { MoveIcon } from './icons/move-icon';

type MatchWinnerProps = {
    winner?: Pod;
    winningMove?: Move;
    isDraw?: boolean;
};

export function MatchWinner({ winner, winningMove, isDraw }: MatchWinnerProps) {
  if (isDraw) {
    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            className="w-full max-w-2xl"
          >
            <Card className="text-center bg-card border-yellow-500 border-4">
              <CardHeader>
                 <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="mx-auto"
                >
                    <Handshake className="w-16 h-16 text-yellow-500" />
                </motion.div>
                <CardTitle className="text-6xl font-black font-headline tracking-tighter text-yellow-500">DRAW</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl text-muted-foreground">Play again to settle the score!</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
    );
  }

  if (!winner || !winningMove) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="text-center bg-card border-accent border-4">
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
            <CardTitle className="text-6xl font-black font-headline tracking-tighter text-primary">{winner.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
              <span className="text-8xl">{winner.emoji}</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-semibold capitalize text-primary">{winningMove}</p>
                <div className="w-16 h-16 bg-background text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={winningMove} className="text-5xl" />
                </div>
                <p className="text-2xl font-semibold capitalize text-primary">Wins!</p>
            </div>
            <p className="text-2xl text-muted-foreground">Advances!</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
