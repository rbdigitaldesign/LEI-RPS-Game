import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Pod, Move } from '@/lib/types';
import { MoveIcon } from './icons/move-icon';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { MOVES } from '@/lib/constants';

type PodCardProps = {
  pod: Pod;
  move?: Move | null;
  isWinner?: boolean;
  isLoser?: boolean;
  isDraw?: boolean;
  reveal: boolean;
  className?: string;
  onMoveSelect: (move: Move) => void;
  selectedMove: Move | null;
  disabled: boolean;
};

const getEmojiForMove = (move: Move) => {
    switch (move) {
      case 'rock': return '🪨';
      case 'paper': return '📄';
      case 'scissors': return '✂️';
      default: return '';
    }
};

export function PodCard({ pod, move, isWinner, isLoser, isDraw, reveal, className, onMoveSelect, selectedMove, disabled }: PodCardProps) {
  return (
    <motion.div
      animate={isWinner && reveal ? { scale: 1.05, y: -5 } : isLoser && reveal ? { scale: 0.95, opacity: 0.7 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <Card
        className={cn(
          'w-full max-w-sm text-center relative overflow-hidden transition-all duration-300 bg-card border-2',
          isWinner && reveal && 'border-primary ring-4 ring-primary',
          isLoser && reveal && 'opacity-70 border-muted',
          isDraw && reveal && 'border-yellow-500',
          className
        )}
      >
        <CardHeader>
          <div className="w-24 h-24 mx-auto bg-secondary flex items-center justify-center border-2 border-border mb-4 relative">
            <span className="text-6xl">{pod.emoji}</span>
          </div>
          <CardTitle className="font-headline text-primary">{pod.name}</CardTitle>
          <CardDescription>Managed by {pod.manager}</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex flex-col items-center justify-center">
          {reveal && move ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("space-y-2", reveal ? "animate-in fade-in zoom-in-50 duration-500" : "")}
            >
              <div className="w-16 h-16 p-3 bg-secondary text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={move} />
              </div>
              <p className="font-bold text-lg capitalize">{move}</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-primary mb-2">Select Move</h3>
              <div className="flex justify-center gap-2">
                {MOVES.map((m) => (
                  <Button key={m} variant={selectedMove === m ? 'default' : 'outline'} size="icon" className="text-2xl w-16 h-16" onClick={() => onMoveSelect(m)} disabled={disabled}>
                    {getEmojiForMove(m)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        {reveal && isWinner && (
          <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none",
              isWinner ? 'opacity-100' : 'opacity-0'
          )}>
              <motion.span 
                initial={{ scale: 3, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: -15 }}
                transition={{ type: 'spring', stiffness: 200, damping: 8, delay: 0.4 }}
                className="text-5xl font-black text-white drop-shadow-lg tracking-widest uppercase"
                style={{ WebkitTextStroke: '2px hsl(var(--primary))' }}
              >
                WINNER
              </motion.span>
          </div>
        )}
        {reveal && isDraw && (
           <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 bg-black/50 opacity-100 pointer-events-none">
              <span className="text-4xl font-bold text-white tracking-widest">DRAW</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
