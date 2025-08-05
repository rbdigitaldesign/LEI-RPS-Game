import type { Move } from '@/lib/types';
import { cn } from '@/lib/utils';

type MoveIconProps = {
  move: Move;
  className?: string;
};

const RockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('w-full h-full', className)}
  >
    <path d="M14 19.85c-2.03.4-4.14.21-6.1-.55-2.28-.86-4.2-2.5-5.5-4.55-1.3-2.05-1.98-4.46-1.98-7.02 0-3.22.95-6.24 2.62-8.62" />
    <path d="M10.12 2.19c1.9.44 3.65 1.48 4.98 2.9" />
    <path d="M22 13.43c0 2.43-.63 4.67-1.74 6.55-1.11 1.88-2.6 3.48-4.34 4.68" />
    <path d="M19.5 9a2.5 2.5 0 0 0-2.5-2.5" />
    <path d="M14.5 9a2.5 2.5 0 0 0-2.5-2.5" />
  </svg>
);

const PaperIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('w-full h-full', className)}
  >
    <path d="M21.5 14.5v6a.5.5 0 0 1-.5.5H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.5a.5.5 0 0 1 .5.5v2" />
    <path d="m18 14-4 4" />
    <path d="m18 18-4-4" />
    <path d="M14 3v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const ScissorsIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('w-full h-full', className)}
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4L8.12 15.88" />
    <path d="M14.47 14.48L20 20" />
    <path d="M8.12 8.12L12 12" />
  </svg>
);

export function MoveIcon({ move, className }: MoveIconProps) {
  switch (move) {
    case 'rock':
      return <RockIcon className={className} />;
    case 'paper':
      return <PaperIcon className={className} />;
    case 'scissors':
      return <ScissorsIcon className={className} />;
    default:
      return null;
  }
}
