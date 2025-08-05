import type { Move } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Hand, HandMetal, Scissors } from 'lucide-react';

export function MoveIcon({ move, className }: { move: Move, className?: string }) {
  switch (move) {
    case 'rock':
      return <HandMetal className={cn('w-full h-full', className)} />;
    case 'paper':
      return <Hand className={cn('w-full h-full', className)} />;
    case 'scissors':
      return <Scissors className={cn('w-full h-full', className)} />;
    default:
      return null;
  }
}
