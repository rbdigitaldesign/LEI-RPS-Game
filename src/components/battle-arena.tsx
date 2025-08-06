
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
  <div className="flex justify-center gap-1 mt-1">
    {MOVES.map((move) => (
      <button
        key={move}
        onClick={() => onSelect(move)}
        disabled={disabled}
        className={cn(
          "w-12 h-12 p-2 bg-secondary border-2 border-primary/50 flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:border-accent disabled:opacity-50 disabled:transform-none",
          selectedMove === move && "border-accent ring-2 ring-accent scale-110 bg-primary/20",
          selectedMove && selectedMove !== move && "opacity-50 scale-90"
        )}
      >
        <MoveIcon move={move} className="text-2xl" />
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
        <p className="text-muted-foreground animate-pulse text-lg">
          Tournament Over! Determining winner...
        </p>
      </Card>
    );
  }
  
  const reveal = !!match.moves;
  const isFinalBoss = match.id === 'final-boss-match';

  return (
    <div className="space-y-2 relative">
      {roundNumber !== null && (
        <h2 className={cn(
            "text-xl font-bold text-center uppercase tracking-widest",
             isFinalBoss ? "text-destructive" : "text-accent"
        )}>
          {isFinalBoss ? 'Final Boss' : `Round ${roundNumber}`}
        </h2>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={reveal && match.winner?.id === match.pod1?.id}
          isDraw={reveal && match.isDraw}
          reveal={reveal}
          className="w-full"
        >
         {!reveal && !match.isBye && <MoveSelector onSelect={setPod1Move} selectedMove={pod1Move} disabled={isProcessing} />}
        </PodCard>

        <div className="flex flex-col items-center justify-center gap-2 text-center my-0">
          <p className={cn(
              "text-4xl font-black animate-pulse",
              isFinalBoss ? "text-destructive" : "text-accent"
          )}>VS</p>
          {!reveal && !match.isBye && (
            <Button
              size="lg"
              onClick={handlePlay}
              disabled={!pod1Move || !pod2Move || isProcessing}
              className="w-24 h-24 rounded-full text-base font-black tracking-tighter border-4 border-primary-foreground animate-pulse hover:animate-none disabled:animate-none"
            >
              {isProcessing ? '...' : 'BATTLE'}
            </Button>
          )}
        </div>

        <PodCard
          pod={match.pod2}
          move={reveal ? match.moves?.pod2 : pod2Move}
          isWinner={reveal && match.winner?.id === match.pod2?.id}
          isDraw={reveal && match.isDraw}
          reveal={reveal}
          className="w-full"
          isBoss={isFinalBoss}
        >
         {!reveal && !match.isBye && <MoveSelector onSelect={setPod2Move} selectedMove={pod2Move} disabled={isProcessing} />}
        </PodCard>
      </div>
    </div>
  );
}

    