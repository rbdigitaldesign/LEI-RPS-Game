'use client';

import { useState, useEffect } from 'react';
import { PodCard } from './pod-card';
import type { Match } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

type BattleArenaProps = {
  match: Match | null;
  isProcessing: boolean;
};

export function BattleArena({ match, isProcessing }: BattleArenaProps) {
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setReveal(false);

    if (match?.moves) {
      const revealTimer = setTimeout(() => {
        setReveal(true);
      }, 1000);

      return () => {
        clearTimeout(revealTimer);
      };
    }
  }, [match]);

  if (!match || !match.pod1 || !match.pod2) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground animate-pulse">{isProcessing ? 'Finding next match...' : 'Waiting for tournament to start...'}</p>
        </CardContent>
      </Card>
    );
  }

  const isWinner1 = match.winner?.id === match.pod1.id;
  const isWinner2 = match.winner?.id === match.pod2.id;
  const isDraw = !!match.moves && !match.winner;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center justify-items-center">
        <PodCard
          pod={match.pod1}
          move={match.moves?.pod1}
          isWinner={isWinner1}
          isLoser={isWinner2}
          isDraw={isDraw}
          reveal={reveal}
          className="md:justify-self-end"
        />
        <div className="text-4xl md:text-6xl font-black text-center text-primary-foreground bg-primary rounded-full w-20 h-20 flex items-center justify-center my-4 md:my-0 shadow-lg order-first md:order-none col-span-1 md:col-span-1">
          VS
        </div>
        <PodCard
          pod={match.pod2}
          move={match.moves?.pod2}
          isWinner={isWinner2}
          isLoser={isWinner1}
          isDraw={isDraw}
          reveal={reveal}
          className="md:justify-self-start"
        />
      </div>
    </div>
  );
}
