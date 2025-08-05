'use client';

import { useState, useEffect } from 'react';
import { PodCard } from './pod-card';
import type { Match, Move, Pod } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { MOVES } from '@/lib/constants';

type BattleArenaProps = {
  match: Match | null;
  isProcessing: boolean;
  onPlayMatch: (pod1Move: Move, pod2Move: Move) => void;
  roundNumber: number | null;
};

export function BattleArena({ match, isProcessing, onPlayMatch, roundNumber }: BattleArenaProps) {
  const [pod1Move, setPod1Move] = useState<Move | null>(null);
  const [pod2Move, setPod2Move] = useState<Move | null>(null);

  useEffect(() => {
    setPod1Move(null);
    setPod2Move(null);
  }, [match]);

  const handlePlay = () => {
    if (pod1Move && pod2Move) {
      onPlayMatch(pod1Move, pod2Move);
    }
  };

  if (!match) {
    return (
      <Card className="text-center py-12 bg-card">
        <CardContent>
          <p className="text-muted-foreground animate-pulse">
            Loading next match...
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const reveal = !!match.moves;

  return (
    <div className="space-y-4 relative">
      {roundNumber && (
        <h2 className="text-3xl font-bold text-center text-accent uppercase tracking-widest">
          Round {roundNumber}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={reveal && match.winner?.id === match.pod1?.id}
          reveal={reveal}
        />
        <PodCard
          pod={match.pod2}
          move={reveal ? match.moves?.pod2 : pod2Move}
          isWinner={reveal && match.winner?.id === match.pod2?.id}
          reveal={reveal}
        />
      </div>

      {!reveal && (
        <Card className="mt-8 bg-card border-2">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-primary text-center">{match.pod1.name}</h3>
                <div className="flex justify-center gap-2">
                  {MOVES.map((m) => (
                    <Button key={m} variant={pod1Move === m ? 'default' : 'outline'} size="lg" onClick={() => setPod1Move(m)} disabled={isProcessing}>
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-primary text-center">{match.pod2.name}</h3>
                <div className="flex justify-center gap-2">
                  {MOVES.map((m) => (
                    <Button key={m} variant={pod2Move === m ? 'default' : 'outline'} size="lg" onClick={() => setPod2Move(m)} disabled={isProcessing}>
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button size="lg" onClick={handlePlay} disabled={!pod1Move || !pod2Move || isProcessing} className="w-full text-lg">
              {isProcessing ? 'Playing...' : 'Play Match'}
            </Button>
          </CardContent>
        </Card>
      )}

      {reveal && (
        <div className="text-center mt-4">
            {!match.winner ? (
                 <p className="text-xl font-bold text-destructive bg-black/80 p-2 inline-block border-2 border-destructive">It's a draw! Replay!</p>
            ) : (
                <p className="text-2xl font-bold text-primary animate-pulse">Next match coming up...</p>
            )}
        </div>
      )}
    </div>
  );
}
