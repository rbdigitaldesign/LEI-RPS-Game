'use client';

import { useState, useEffect } from 'react';
import { PodCard } from './pod-card';
import type { Match, Move, Pod } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AnimatePresence } from 'framer-motion';
import { MatchWinner } from './match-winner';

type BattleArenaProps = {
  match: Match | null;
  isProcessing: boolean;
  onPlayMatch: (pod1Move: Move, pod2Move: Move) => void;
  roundNumber: number | null;
};

export function BattleArena({ match, isProcessing, onPlayMatch, roundNumber }: BattleArenaProps) {
  const [pod1Move, setPod1Move] = useState<Move | null>(null);
  const [pod2Move, setPod2Move] = useState<Move | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    // Reset local state when the match changes
    setPod1Move(null);
    setPod2Move(null);
    setShowWinner(false);

    // If the new match has a winner, we need to decide whether to show the modal.
    // The `playMatch` function now controls the flow, so we just need to react to `match.winner`.
    if (match?.winner && match.moves) {
        // A short delay to let the user see the played moves before the winner modal pops up.
        const timer = setTimeout(() => setShowWinner(true), 250);
        return () => clearTimeout(timer);
    }
  }, [match?.id]); // Depend on match.id to reliably detect a new match

  const handlePlay = () => {
    if (pod1Move && pod2Move) {
      onPlayMatch(pod1Move, pod2Move);
    }
  };

  if (!match || !match.pod1 || !match.pod2) {
    return (
      <Card className="text-center py-12 bg-card">
        <CardContent>
          <p className="text-muted-foreground animate-pulse">
            {isProcessing ? 'Loading next match...' : 'Tournament has ended.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const reveal = !!match.moves;
  const hasWinner = !!match.winner;
  const isDraw = reveal && !hasWinner;
  
  const winningMove = hasWinner && match.moves
    ? (match.winner?.id === match.pod1?.id ? match.moves.pod1 : match.moves.pod2)
    : null;

  return (
    <div className="space-y-4 relative">
        <AnimatePresence>
            {showWinner && hasWinner && winningMove && (
                <MatchWinner winner={match.winner as Pod} winningMove={winningMove} />
            )}
        </AnimatePresence>

        {roundNumber && (
            <h2 className="text-3xl font-bold text-center text-accent uppercase tracking-widest">
                Round {roundNumber}
            </h2>
        )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center justify-items-center">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={match.winner?.id === match.pod1.id}
          isLoser={match.winner?.id === match.pod2.id}
          isDraw={isDraw}
          reveal={reveal}
          className="md:justify-self-end"
          onMoveSelect={(move) => setPod1Move(move)}
          selectedMove={pod1Move}
          disabled={reveal || isProcessing}
        />
        <div className="flex flex-col items-center justify-center order-first md:order-none col-span-1 md:col-span-1 h-full">
            <div className="flex-1 flex flex-col items-center justify-end">
                <div className="text-4xl md:text-6xl font-black text-center text-primary-foreground bg-primary w-20 h-20 flex items-center justify-center border-4 border-primary-foreground">
                    VS
                </div>
            </div>
             {!reveal && (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <Button 
                        size="lg" 
                        onClick={handlePlay} 
                        disabled={!pod1Move || !pod2Move || isProcessing}
                        className="w-28 h-28 rounded-full text-2xl font-bold uppercase tracking-wider"
                    >
                    {isProcessing ? '...' : 'Battle'}
                    </Button>
                </div>
            )}
        </div>
        <PodCard
          pod={match.pod2}
          move={reveal ? match.moves?.pod2 : pod2Move}
          isWinner={match.winner?.id === match.pod2.id}
          isLoser={match.winner?.id === match.pod1.id}
          isDraw={isDraw}
          reveal={reveal}
          className="md:justify-self-start"
          onMoveSelect={(move) => setPod2Move(move)}
          selectedMove={pod2Move}
          disabled={reveal || isProcessing}
        />
      </div>

      {isDraw && reveal && (
        <div className="text-center mt-4">
            <p className="text-xl font-bold text-destructive bg-black/80 p-2 inline-block border-2 border-destructive">It's a draw! Replay!</p>
        </div>
      )}
    </div>
  );
}
