
import type { Move } from '@/lib/types';

const RockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <path fill="#808080" d="M12 10h8v2h-8zM10 12h12v2h-12zM8 14h16v10H8zM10 24h12v2H10z"/>
        <path fill="#a0a0a0" d="M13 11h6v1h-6zM11 13h10v1h-10zM9 15h14v8H9zM11 25h10v1H11z"/>
    </svg>
);

const PaperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <path fill="white" d="M8 6h16v20H8z"/>
        <path fill="#c0c0c0" d="M10 10h12v2H10zM10 14h12v2H10zM10 18h12v2H10zM10 22h8v2h-8z"/>
    </svg>
);

const ScissorsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        <path fill="#c0c0c0" d="M10 8a4 4 0 10-8 0 4 4 0 008 0zM22 8a4 4 0 108 0 4 4 0 00-8 0z"/>
        <path fill="#c0c0c0" d="M11 12l-6 14h2l4-9 4 9h2l-6-14zM21 12l6 14h-2l-4-9-4 9h-2l6-14z"/>
        <path fill="#e0e0e0" d="M9 8a3 3 0 10-6 0 3 3 0 006 0zM23 8a3 3 0 10-6 0 3 3 0 006 0z"/>
    </svg>
);


export function MoveIcon({ move }: { move: Move | null }) {
  if (!move) return null;
  switch (move) {
    case 'rock':
      return <RockIcon />;
    case 'paper':
      return <PaperIcon />;
    case 'scissors':
      return <ScissorsIcon />;
    default:
      return null;
  }
}
