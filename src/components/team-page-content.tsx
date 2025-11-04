
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useServerTournament } from '@/hooks/use-server-tournament';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/header';
import { MoveIcon } from '@/components/icons/move-icon';
import { MOVES } from '@/lib/constants';
import type { Move, Pod, Match, TournamentState } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Swords, Bot, Hourglass, Clock, Timer as TimerIcon, Handshake, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { PODS } from '@/lib/constants';

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

async function setTeamReady(teamName: string) {
    const response = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'teamReady', teamName }),
    });
    if (!response.ok) {
        throw new Error('Failed to set team as ready');
    }
    return response.json();
}

const Countdown = () => {
    const [count, setCount] = useState(3);

    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [count]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
                key={count}
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
                className="text-9xl font-headline text-primary"
            >
                {count > 0 ? count : 'GO!'}
            </motion.div>
        </div>
    );
};


export function TeamPageContent({ teamName }: { teamName: string }) {
  const { tournament, refetch } = useServerTournament();
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isTie, setIsTie] = useState(false);
  const [hasTournamentStarted, setHasTournamentStarted] = useState(false);

  const { toast } = useToast();
  const lastTournamentState = useRef<TournamentState | null>(null);

  useEffect(() => {
    if (tournament) {
      setHasTournamentStarted(true);
    }
  }, [tournament]);

  const currentMatch = tournament?.rounds
    .flatMap(r => r.matches)
    .find(m => m.id === tournament.currentMatchId);

  const myOwnPod = PODS.find(pod => pod.name === teamName);

  const myPod = currentMatch?.pod1?.name === teamName ? currentMatch.pod1 : currentMatch?.pod2;
  const opponentPod = currentMatch?.pod1?.name === teamName ? currentMatch.pod2 : currentMatch?.pod1;

  const isMyTurn = currentMatch && (currentMatch.pod1?.name === teamName || currentMatch.pod2?.name === teamName);
  
  const teamIsPod1 = currentMatch?.pod1?.name === teamName;
  const moveAlreadySubmitted = teamIsPod1 ? !!(currentMatch?.moves as any)?.pod1 : !!(currentMatch?.moves as any)?.pod2;

  const isTeamReady = tournament?.readyTeams?.includes(teamName) ?? false;

  useEffect(() => {
    if (tournament && lastTournamentState.current) {
        const previousCompletedMatches = lastTournamentState.current.rounds
            .flatMap(r => r.matches)
            .filter(m => m.winner)
            .map(m => m.id);
        
        const newlyCompletedMatches = tournament.rounds
            .flatMap(r => r.matches)
            .filter(m => m.winner && !previousCompletedMatches.includes(m.id));

        const justWonMatch = newlyCompletedMatches.find(m => m.winner?.name === teamName);
        if (justWonMatch) {
            toast({
                title: "You Won!",
                description: "Congratulations! Waiting for your next opponent.",
                duration: 5000,
            });
        }
        
        if (currentMatch && lastTournamentState.current) {
            const previousMatch = lastTournamentState.current.rounds.flatMap(r => r.matches).find(m => m.id === currentMatch.id);
            if (previousMatch && currentMatch.moveHistory && previousMatch.moveHistory) {
                if (currentMatch.moveHistory.length > previousMatch.moveHistory.length) {
                    const latestRound = currentMatch.moveHistory[currentMatch.moveHistory.length - 1];
                    if (latestRound.pod1 === latestRound.pod2) {
                        setIsTie(true);
                        setTimeout(() => setIsTie(false), 2500); 
                    }
                }
            }
        }
    }
    lastTournamentState.current = tournament;
  }, [tournament, teamName, toast, currentMatch]);


  const handleSubmitMove = useCallback(async () => {
    if (!selectedMove) return;
    setIsSubmitting(true);
    try {
      await playMove(teamName, selectedMove);
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
  }, [teamName, refetch, toast, selectedMove]);

  const handleAutoSubmit = useCallback(async () => {
    const randomMove = MOVES[Math.floor(Math.random() * MOVES.length)];
    setIsSubmitting(true);
     try {
      await playMove(teamName, randomMove);
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit your move automatically. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [teamName, refetch, toast]);

  useEffect(() => {
    if (isMyTurn && !moveAlreadySubmitted) {
      setSelectedMove(null); // Reset selection for new turn
      setTimer(60);
      const interval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isMyTurn, moveAlreadySubmitted, handleAutoSubmit]);

  const isEliminated = tournament?.rounds
  .flatMap(r => r.matches)
  .some(m => m.loser?.name === teamName);

  useEffect(() => {
    if (isEliminated) {
      toast({
        title: "You've been eliminated!",
        description: "Redirecting to the tournament overview in 4 seconds...",
        duration: 4000,
        variant: "destructive",
      });
      const redirectTimer = setTimeout(() => {
        window.location.href = '/?skipIntro=true';
      }, 4000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isEliminated, toast]);

  const handleReadyClick = async () => {
    setIsSubmitting(true);
    try {
        await setTeamReady(teamName);
        refetch();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error setting ready status' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (hasTournamentStarted && !tournament) {
      // Tournament was active, but now it's not (i.e., it was reset)
      return (
        <Card className="w-full max-w-md text-center">
          <CardHeader>
             <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
            <CardTitle>Tournament Reset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The tournament has been reset. Redirecting...</p>
          </CardContent>
        </Card>
      );
    }
    
    if (tournament?.status === 'countdown') {
        return <Countdown />;
    }

    if (tournament?.status === 'readying') {
        return (
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <span className="text-6xl">{myOwnPod?.emoji}</span>
                    <CardTitle className="text-3xl font-headline mt-2">{teamName}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isTeamReady ? (
                        <div className="space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <p className="text-xl font-bold text-green-400">You are ready!</p>
                            <p className="text-muted-foreground">Waiting for other pods to get ready...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-lg text-muted-foreground">The tournament is about to begin.</p>
                            <Button onClick={handleReadyClick} disabled={isSubmitting} size="lg" className="w-full h-24 text-2xl font-headline">
                                {isSubmitting ? 'Getting Ready...' : 'Ready to Battle!'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (isTie) {
        return (
            <Card className="w-full max-w-md text-center border-2 border-yellow-500">
                <CardHeader>
                    <Handshake className="w-16 h-16 text-yellow-500 mx-auto" />
                    <CardTitle className="text-5xl font-bold tracking-tighter text-yellow-500 mt-2 font-headline">DRAW</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground mt-2">A rematch is taking place!</p>
                </CardContent>
            </Card>
        );
    }

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


    if (isEliminated) {
      return (
            <Card className="w-full max-w-md text-center border-2 border-destructive">
              <CardHeader>
                
                <div className="text-lg font-medium text-destructive font-headline">
                  Eliminated from Tournament
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-6xl grayscale">{myOwnPod?.emoji}</div>
                <div className="text-lg text-destructive font-headline">❌ ELIMINATED</div>
                <p className="text-sm text-muted-foreground">
                  Your team has been eliminated from the tournament. Thank you for participating!
                </p>
                {tournament.winner && (
                  <div className="mt-4 p-3 bg-muted rounded">
                    <p className="text-sm font-medium">Tournament Winner:</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-2xl">{(tournament.winner as Pod).emoji}</span>
                      <span className="font-bold">{(tournament.winner as Pod).name}</span>
                    </div>
                  </div>
                )}
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
                        <Link href="/?skipIntro=true">Back to Bracket</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!isMyTurn || moveAlreadySubmitted) {
      return (
        <Card className="w-full max-w-2xl text-center border-primary ring-4 ring-primary/20">
        <CardHeader>
          <div className="flex items-center justify-center gap-4 mb-2">
            
  
            <div className="flex flex-col items-center">
            <span className="text-6xl">{myOwnPod?.emoji}</span>
            <CardTitle className="font-headline mt-2 text-2xl">{myOwnPod?.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Represented by {myOwnPod?.manager}</p>
            </div>
             
          
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground"/>
            <span>Waiting for your next match...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The tournament is in progress. You'll be notified when it's your turn to play.
          </p>
        </CardContent>
      </Card>
      );
    }


    return (
      <Card className="w-full max-w-2xl text-center border-primary ring-4 ring-primary/20">
        <CardHeader>
           <div className="flex items-center justify-center gap-2 text-2xl font-bold font-headline mb-4">
            <TimerIcon className="w-8 h-8"/>
            <span className={cn(timer <= 10 && 'text-destructive')}>{timer}s</span>
          </div>
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
                disabled={isSubmitting}
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
  
    // Effect for redirecting on reset
    useEffect(() => {
        if (hasTournamentStarted && !tournament) {
            toast({
                title: 'Tournament Reset',
                description: 'The tournament has been reset. Redirecting to the main page...',
                duration: 4000,
            });
            const redirectTimer = setTimeout(() => {
                window.location.href = '/?skipIntro=true';
            }, 4000);
            return () => clearTimeout(redirectTimer);
        }
    }, [hasTournamentStarted, tournament, toast]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background">
      <Header />
      <main className="flex flex-grow flex-col items-center justify-center w-full">
         <AnimatePresence mode="wait">
            <motion.div
                key={currentMatch?.id || tournament?.status || 'waiting'}
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
