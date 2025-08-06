
import type { Move } from '@/lib/types';

const getEmojiForMove = (move: Move): string => {
    switch (move) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '';
    }
}

export function MoveIcon({ move, className }: { move: Move | null, className?: string }) {
  if (!move) return null;
  
  return (
    <span className={className} role="img" aria-label={move}>
        {getEmojiForMove(move)}
    </span>
  )
}
