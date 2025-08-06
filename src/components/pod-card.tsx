
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Pod, Move } from '@/lib/types';
import { MoveIcon } from './icons/move-icon';
import { motion } from 'framer-motion';

type PodCardProps = {
  pod: Pod | null;
  move?: Move | null;
  isWinner?: boolean;
  reveal: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PodCard({ pod, move, isWinner, reveal, className, children }: PodCardProps) {
  if (!pod) {
    return (
      <Card className={cn(
        'w-full max-w-xs text-center relative overflow-hidden transition-all duration-300 bg-card/50 border-2 border-dashed flex items-center justify-center min-h-[260px]',
        className
      )}>
        <p className="text-muted-foreground text-sm">Waiting for opponent...</p>
      </Card>
    );
  }

  return (
    <motion.div
      animate={isWinner ? { scale: 1.05 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
    >
      <Card
        className={cn(
          'w-full max-w-xs text-center relative overflow-hidden transition-all duration-300 bg-card border-2',
          isWinner && 'border-accent ring-2 ring-accent shadow-lg shadow-accent/20',
          !isWinner && reveal && 'opacity-50 scale-95',
          className
        )}
      >
        <CardHeader className="p-4">
          <div className="w-16 h-16 mx-auto bg-secondary flex items-center justify-center border-2 border-border mb-2 relative">
            <span className="text-4xl">{pod.emoji}</span>
          </div>
          <CardTitle className="font-headline text-primary text-xl">{pod.name}</CardTitle>
          <CardDescription className="text-xs">Managed by {pod.manager}</CardDescription>
        </CardHeader>
        <CardContent className="h-28 flex flex-col items-center justify-center p-2">
          {reveal && move ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <div className="w-16 h-16 p-2 bg-secondary text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={move} />
              </div>
              <p className="font-bold text-base capitalize">{move}</p>
            </motion.div>
          ) : (
            children || (
                <div className="text-muted-foreground text-sm">
                    <p>Waiting for match...</p>
                </div>
            )
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
