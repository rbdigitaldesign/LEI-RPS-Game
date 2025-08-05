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

  useEffect(() => {
    setPod1Move(null);
    setPod2Move(null);
  }, [match]);

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
            {isProcessing ? 'Next match...' : 'Tournament Ended'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const reveal = !!match.moves;
  const hasWinner = !!match.winner;
  const isDraw = reveal && !hasWinner;

  const getWinningMove = (): Move | null => {
    if (!match.winner || !match.moves) return null;
    return match.winner.id === match.pod1?.id ? match.moves.pod1 : match.moves.pod2;
  }
  
  const winningMove = getWinningMove();

  const handlePod1MoveSelect = (move: Move) => {
    setPod1Move(pod1Move === move ? null : move);
  }

  const handlePod2MoveSelect = (move: Move) => {
    setPod2Move(pod2Move === move ? null : move);
  }

  return (
    <div className="space-y-4 relative">
        <AnimatePresence>
            {hasWinner && reveal && winningMove && (
                <MatchWinner winner={match.winner as Pod} winningMove={winningMove} />
            )}
        </AnimatePresence>

        {roundNumber && (
            <h2 className="text-3xl font-bold text-center text-accent uppercase tracking-widest">
                Round {roundNumber}
            </h2>
        )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-start justify-items-center">
        <PodCard
          pod={match.pod1}
          move={reveal ? match.moves?.pod1 : pod1Move}
          isWinner={match.winner?.id === match.pod1.id}
          isLoser={match.winner?.id === match.pod2.id}
          isDraw={isDraw}
          reveal={reveal}
          className="md:justify-self-end"
          onMoveSelect={handlePod1MoveSelect}
          selectedMove={pod1Move}
          disabled={reveal}
        />
        <div className="flex flex-col items-center justify-center order-first md:order-none col-span-1 md:col-span-1">
            <div className="text-4xl md:text-6xl font-black text-center text-primary-foreground bg-primary w-20 h-20 flex items-center justify-center border-4 border-primary-foreground">
                VS
            </div>
             {!reveal && (
                <div className="mt-4">
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
          onMoveSelect={handlePod2MoveSelect}
          selectedMove={pod2Move}
          disabled={reveal}
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
