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
        'w-full max-w-sm text-center relative overflow-hidden transition-all duration-300 bg-card/50 border-2 border-dashed flex items-center justify-center min-h-[300px]',
        className
      )}>
        <p className="text-muted-foreground">Waiting for opponent...</p>
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
          'w-full max-w-sm text-center relative overflow-hidden transition-all duration-300 bg-card border-2',
          isWinner && 'border-accent ring-4 ring-accent shadow-2xl shadow-accent/20',
          !isWinner && reveal && 'opacity-50 scale-95',
          className
        )}
      >
        <CardHeader>
          <div className="w-24 h-24 mx-auto bg-secondary flex items-center justify-center border-2 border-border mb-4 relative">
            <span className="text-6xl">{pod.emoji}</span>
          </div>
          <CardTitle className="font-headline text-primary text-2xl">{pod.name}</CardTitle>
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
              <div className="w-20 h-20 p-3 bg-secondary text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={move} />
              </div>
              <p className="font-bold text-lg capitalize">{move}</p>
            </motion.div>
          ) : (
            children || (
                <div className="text-muted-foreground">
                    <p>Waiting for match...</p>
                </div>
            )
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
