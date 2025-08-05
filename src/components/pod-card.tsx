import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Pod, Move } from '@/lib/types';
import { MoveIcon } from './icons/move-icon';
import { motion } from 'framer-motion';

type PodCardProps = {
  pod: Pod;
  move?: Move | null;
  isWinner?: boolean;
  reveal: boolean;
  className?: string;
};

export function PodCard({ pod, move, isWinner, reveal, className }: PodCardProps) {
  return (
    <motion.div
      animate={isWinner ? { scale: 1.05 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <Card
        className={cn(
          'w-full max-w-sm text-center relative overflow-hidden transition-all duration-300 bg-card border-2',
          isWinner && 'border-primary ring-4 ring-primary',
          !isWinner && reveal && 'opacity-60',
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
              className="space-y-2"
            >
              <div className="w-16 h-16 p-3 bg-secondary text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={move} />
              </div>
              <p className="font-bold text-lg capitalize">{move}</p>
            </motion.div>
          ) : (
            <div className="text-muted-foreground">
              <p>Waiting for match...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
