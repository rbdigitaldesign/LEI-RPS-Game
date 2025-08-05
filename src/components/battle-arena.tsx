'use client';

import { useState, useEffect } from 'react';
import { PodCard } from './pod-card';
import type { Match, Move } from '@/lib/types';
import { Button } from './ui/button';
import { MoveIcon } from './icons/move-icon';
import { MOVES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Card } from './ui/card';

type BattleArenaProps = {
  match: Match | null;
  isProcessing: boolean;
  onPlayMatch: (pod1Move: Move, pod2Move: Move) => void;
  roundNumber: number | null;
};

const MoveSelector = ({ onSelect, selectedMove, disabled }: { onSelect: (move: Move) => void, selectedMove: Move | null, disabled: boolean }) => (
  <div className="flex justify-center gap-2 sm:gap-4 mt-4">
    {MOVES.map((move) => (
      <button
        key={move}
        onClick={() => onSelect(move)}
        disabled={disabled}
        className={cn(
          "w-16 h-16 sm:w-20 sm:h-20 bg-secondary border-2 border-primary/50 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:border-accent disabled:opacity-50 disabled:transform-none",
          selectedMove === move && "border-accent ring-4 ring-accent scale-110 bg-primary/20",
          selectedMove && selectedMove !== move && "opacity-50 scale-90"
        )}
      >
        <MoveIcon move={move} />
      </button>
    ))}
  </div>
);

export function BattleArena({ match, isProcessing, onPlayMatch, roundNumber }: BattleArenaProps) {
  const [pod1Move, setPod1Move] = useState<Move | null>(null);
  const [pod2Move, setPod2Move] = useState<Move | null>(null);

  useEffect(() => {
    setPod1Move(null);
    setPod2Move(null);
  }, [match?.id]);

  const handlePlay = () => {
    if (pod1Move && pod2Move) {
      onPlayMatch(pod1Move, pod2Move);
    }
  };

  if (!match) {
    return (
       <Card className="text-center py-24 bg-card">
        <p className="text-muted-foreground animate-pulse text-xl">
          Loading tournament...
        </p>
      </Card>
    );
  }
  
  const reveal = !!match.moves;

  return (
    <div className="space-y-4 relative">
      {roundNumber && (
        <h2 className="text-3xl font-bold text-center text-accent uppercase tracking-widest">
          {roundNumber > 0 ? `Round ${roundNumber}` : 'Finals'}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={reveal && match.winner?.id === match.pod1?.id}
          reveal={reveal}
        >
         {!reveal && <MoveSelector onSelect={setPod1Move} selectedMove={pod1Move} disabled={isProcessing} />}
        </PodCard>

        <div className="text-center my-4 md:my-0">
          <p className="text-5xl font-black text-destructive animate-pulse">VS</p>
        </div>

        <PodCard
          pod={match.pod2}
          move={reveal ? match.moves?.pod2 : pod2Move}
          isWinner={reveal && match.winner?.id === match.pod2?.id}
          reveal={reveal}
          className="md:col-start-3"
        >
         {!reveal && <MoveSelector onSelect={setPod2Move} selectedMove={pod2Move} disabled={isProcessing} />}
        </PodCard>
      </div>

      {!reveal && (
        <div className="flex justify-center pt-8">
          <Button
            size="lg"
            onClick={handlePlay}
            disabled={!pod1Move || !pod2Move || isProcessing}
            className="w-48 h-48 rounded-full text-4xl font-black tracking-tighter border-8 border-primary-foreground animate-pulse hover:animate-none disabled:animate-none"
          >
            {isProcessing ? '...' : 'BATTLE'}
          </Button>
        </div>
      )}
    </div>
  );
}
