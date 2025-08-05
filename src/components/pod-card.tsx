import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Pod, Move } from '@/lib/types';
import { MoveIcon } from './icons/move-icon';

type PodCardProps = {
  pod: Pod;
  move?: Move | null;
  isWinner?: boolean;
  isLoser?: boolean;
  isDraw?: boolean;
  reveal: boolean;
  className?: string;
};

export function PodCard({ pod, move, isWinner, isLoser, isDraw, reveal, className }: PodCardProps) {
  return (
    <Card
      className={cn(
        'w-full max-w-sm text-center relative overflow-hidden transition-all duration-500 transform',
        isWinner && 'border-primary ring-2 ring-primary shadow-lg scale-105',
        isLoser && 'opacity-50 scale-95',
        className
      )}
    >
      <CardHeader>
        <div className="w-24 h-24 mx-auto rounded-full bg-secondary flex items-center justify-center border-2 border-border mb-4 relative shadow-inner">
          <span className="text-6xl">{pod.emoji}</span>
        </div>
        <CardTitle className="font-headline">{pod.name}</CardTitle>
        <CardDescription>Managed by {pod.manager}</CardDescription>
      </CardHeader>
      <CardContent className="h-28 flex flex-col items-center justify-center">
        {move ? (
          <div className={cn("space-y-2", reveal ? "animate-in fade-in zoom-in-50 duration-500" : "")}>
            <div className="w-16 h-16 p-3 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <MoveIcon move={move} />
            </div>
            <p className="font-bold text-lg capitalize">{move}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">Make a selection</p>
          </div>
        )}
      </CardContent>
      {reveal && (
        <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-500 bg-black/50",
            isWinner ? 'opacity-100' : 'opacity-0'
        )}>
            <span className="text-4xl font-bold text-white drop-shadow-lg tracking-widest rotate-[-15deg]">WINNER</span>
        </div>
      )}
      {reveal && isDraw && (
         <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 bg-black/50 opacity-100">
            <span className="text-4xl font-bold text-white drop-shadow-lg tracking-widest">DRAW</span>
        </div>
      )}
    </Card>
  );
}
