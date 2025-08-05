import type { Move } from '@/lib/types';

export function MoveIcon({ move }: { move: Move }) {
  switch (move) {
    case 'rock':
      return <span className="text-5xl">🪨</span>;
    case 'paper':
      return <span className="text-5xl">📄</span>;
    case 'scissors':
      return <span className="text-5xl">✂️</span>;
    default:
      return null;
  }
}
