'use client';

import { useEffect, useState } from 'react';
import { useServerTournament } from '@/hooks/use-server-tournament';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/header';
import { MoveIcon } from '@/components/icons/move-icon';
import { MOVES } from '@/lib/constants';
import type { Move, Pod } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Swords, Bot, Hourglass } from 'lucide-react';
import Link from 'next/link';

async function playMove(teamName: string, move: Move) {
  const response = await fetch('/api/tournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'playMove', teamName, move }),
  });
  if (!response.ok) {
    throw new Error('Failed to play move');
  }
  return response.json();
}

export function TeamPageContent({ teamName }: { teamName: string }) {
  const { tournament, refetch } = useServerTournament();
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentMatch = tournament?.rounds
    .flatMap(r => r.matches)
    .find(m => m.id === tournament.currentMatchId);

  const myPod = currentMatch?.pod1?.name === teamName ? currentMatch.pod1 : currentMatch?.pod2;
  const opponentPod = currentMatch?.pod1?.name === teamName ? currentMatch.pod2 : currentMatch?.pod1;

  const isMyTurn = currentMatch && (currentMatch.pod1?.name === teamName || currentMatch.pod2?.name === teamName);
  
  const teamIsPod1 = currentMatch?.pod1?.name === teamName;
  const moveAlreadySubmitted = teamIsPod1 ? !!(currentMatch?.moves as any)?.pod1 : !!(currentMatch?.moves as any)?.pod2;

  const handleSubmitMove = async () => {
    if (!selectedMove) return;
    setIsSubmitting(true);
    try {
      await playMove(teamName, selectedMove);
      toast({
        title: 'Move Submitted!',
        description: `You played ${selectedMove}. Waiting for opponent.`,
      });
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit your move. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderContent = () => {
    if (!tournament) {
      return (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Tournament Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait for the tournament to begin.</p>
            <Hourglass className="mx-auto mt-4 h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      );
    }

    if (tournament.winner) {
        const isWinner = tournament.winner.name === teamName;
        return (
            <Card className={`w-full max-w-md text-center ${isWinner ? 'border-primary' : 'border-destructive'}`}>
                <CardHeader>
                    <CardTitle>{isWinner ? "🏆 You are the Champion! 🏆" : "Tournament Over"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{isWinner ? `Congratulations, ${teamName}!` : `The winner is ${tournament.winner.name}.`}</p>
                    <Button asChild className="mt-4">
                        <Link href="/">Back to Bracket</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!isMyTurn || moveAlreadySubmitted) {
      return (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Waiting...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {moveAlreadySubmitted ? 'Your move has been submitted. Waiting for your opponent.' : "It's not your turn yet. Please wait."}
            </p>
            <Hourglass className="mx-auto mt-4 h-8 w-8 animate-pulse" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-2xl text-center border-primary ring-4 ring-primary/20">
        <CardHeader>
          <div className="flex justify-around items-center">
            <div className="flex flex-col items-center">
              <span className="text-6xl">{myPod?.emoji}</span>
              <CardTitle className="mt-2 text-2xl font-headline">{myPod?.name}</CardTitle>
            </div>
            <Swords className="h-12 w-12 text-primary" />
            <div className="flex flex-col items-center">
              <span className="text-6xl">{opponentPod?.emoji ?? <Bot />}</span>
              <CardTitle className="mt-2 text-2xl font-headline">{opponentPod?.name ?? 'AI Bot'}</CardTitle>
            </div>
          </div>
          <CardDescription className="pt-4">Select your move to play the round!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 my-4">
            {MOVES.map(move => (
              <motion.button
                key={move}
                onClick={() => setSelectedMove(move)}
                className={cn(
                  "p-4 border-4 rounded-lg transition-all",
                  selectedMove === move ? 'border-primary bg-primary/10' : 'border-transparent'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoveIcon move={move} className="text-6xl" />
                <span className="block mt-2 font-bold capitalize">{move}</span>
              </motion.button>
            ))}
          </div>
          <Button
            onClick={handleSubmitMove}
            disabled={!selectedMove || isSubmitting}
            size="lg"
            className="w-full mt-4 font-bold text-xl"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Move'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background">
      <Header />
      <main className="flex flex-grow flex-col items-center justify-center w-full">
         <AnimatePresence mode="wait">
            <motion.div
                key={currentMatch?.id || 'waiting'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                {renderContent()}
            </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
}
