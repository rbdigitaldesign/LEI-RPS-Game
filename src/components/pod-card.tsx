
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Pod, Move } from '@/lib/types';
import { MoveIcon } from './icons/move-icon';
import { motion } from 'framer-motion';

type PodCardProps = {
  pod: Pod | null;
  move?: Move | null;
  isWinner?: boolean;
  isDraw?: boolean;
  reveal: boolean;
  isBoss?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PodCard({ pod, move, isWinner, isDraw, reveal, isBoss, className, children }: PodCardProps) {
  if (!pod) {
    return (
      <Card className={cn(
        'w-full text-center relative overflow-hidden transition-all duration-300 bg-card/50 border-2 border-dashed flex items-center justify-center min-h-[148px]',
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
      className={className}
    >
      <Card
        className={cn(
          'w-full text-center relative overflow-hidden transition-all duration-300 bg-card border-2',
          isWinner && 'border-accent ring-2 ring-accent shadow-lg shadow-accent/20',
          !isWinner && reveal && 'opacity-50 scale-95',
          isDraw && 'border-yellow-500',
          isBoss && 'border-destructive'
        )}
      >
        {isWinner && reveal && (
          <motion.div 
            className="absolute inset-0 bg-accent/90 flex items-center justify-center z-10 p-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          >
            <p className="text-2xl lg:text-3xl font-black text-accent-foreground tracking-tighter -rotate-6 font-headline">{pod.name} WIN!</p>
          </motion.div>
        )}
        {isDraw && reveal && (
          <motion.div 
            className="absolute inset-0 bg-yellow-500/90 flex items-center justify-center z-10 p-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          >
            <p className="text-2xl lg:text-3xl font-black text-yellow-950 tracking-tighter font-headline">DRAW</p>
          </motion.div>
        )}
        <CardHeader className="p-2">
          <div className="w-16 h-16 mx-auto bg-secondary flex items-center justify-center border-2 border-border mb-1 relative">
            <span className="text-4xl">{pod.emoji}</span>
          </div>
          <CardTitle className={cn("text-lg", isBoss ? "text-destructive" : "text-primary")}>{pod.name}</CardTitle>
          <CardDescription className="text-[10px]">Managed by {pod.manager}</CardDescription>
        </CardHeader>
        <CardContent className="h-24 flex flex-col items-center justify-center p-1">
          {reveal && move ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <div className="w-12 h-12 bg-background text-secondary-foreground flex items-center justify-center border-2">
                  <MoveIcon move={move} className="text-3xl" />
              </div>
              <p className="font-bold text-sm capitalize">{move}</p>
            </motion.div>
          ) : (
            children || (
                <div className="text-muted-foreground text-xs">
                    <p>Waiting for match...</p>
                </div>
            )
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
