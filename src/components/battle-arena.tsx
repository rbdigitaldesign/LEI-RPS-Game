'use client';

import { useState, useEffect } from 'react';
import { PodCard } from './pod-card';
import type { Match, Move } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { MoveIcon } from './icons/move-icon';
import { MOVES } from '@/lib/constants';

type BattleArenaProps = {
  match: Match | null;
  isProcessing: boolean;
  onPlayMatch: (pod1Move: Move, pod2Move: Move) => void;
};

export function BattleArena({ match, isProcessing, onPlayMatch }: BattleArenaProps) {
  const [reveal, setReveal] = useState(false);
  const [pod1Move, setPod1Move] = useState<Move | null>(null);
  const [pod2Move, setPod2Move] = useState<Move | null>(null);

  useEffect(() => {
    setReveal(false);
    setPod1Move(null);
    setPod2Move(null);
  }, [match]);

  const handlePlay = () => {
    if (pod1Move && pod2Move) {
      setReveal(true);
      onPlayMatch(pod1Move, pod2Move);
    }
  };

  if (!match || !match.pod1 || !match.pod2) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground animate-pulse">
            {isProcessing ? 'Advancing to next match...' : 'Tournament has ended. Reset to play again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isWinner1 = match.winner?.id === match.pod1.id;
  const isWinner2 = match.winner?.id === match.pod2.id;
  const isDraw = !!match.moves && !match.winner;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-start justify-items-center">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={reveal && isWinner1}
          isLoser={reveal && isWinner2}
          isDraw={reveal && isDraw}
          reveal={reveal}
          className="md:justify-self-end"
        />
        <div className="text-4xl md:text-6xl font-black text-center text-primary-foreground bg-primary rounded-full w-20 h-20 flex items-center justify-center my-4 md:my-0 shadow-lg order-first md:order-none col-span-1 md:col-span-1">
          VS
        </div>
        <PodCard
          pod={match.pod2}
          move={reveal ? match.moves?.pod2 : pod2Move}
          isWinner={reveal && isWinner2}
          isLoser={reveal && isWinner1}
          isDraw={reveal && isDraw}
          reveal={reveal}
          className="md:justify-self-start"
        />
      </div>

      {!reveal && (
        <Card className="mt-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center space-y-3">
              <h3 className="font-bold text-lg">Choose {match.pod1.name}'s Move</h3>
              <div className="flex justify-center gap-2">
                {MOVES.map((move) => (
                  <Button key={move} variant={pod1Move === move ? 'default' : 'outline'} size="icon" onClick={() => setPod1Move(move)}>
                    <MoveIcon move={move} className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="font-bold text-lg">Choose {match.pod2.name}'s Move</h3>
              <div className="flex justify-center gap-2">
                {MOVES.map((move) => (
                  <Button key={move} variant={pod2Move === move ? 'default' : 'outline'} size="icon" onClick={() => setPod2Move(move)}>
                    <MoveIcon move={move} className="w-5 h-5" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Button size="lg" onClick={handlePlay} disabled={!pod1Move || !pod2Move || isProcessing}>
              {isProcessing ? 'Playing...' : 'Play Match'}
            </Button>
          </div>
        </Card>
      )}

      {isDraw && reveal && (
        <div className="text-center mt-4">
            <p className="text-xl font-bold text-destructive">It's a draw! Replay the match.</p>
        </div>
      )}
    </div>
  );
}
