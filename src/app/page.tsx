
'use client';

import { useState, useEffect } from 'react';
import { useTournament } from '@/hooks/use-tournament';
import { Button } from '@/components/ui/button';
import { BattleArena } from '@/components/battle-arena';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Move } from '@/lib/types';
import { Trophy, Swords, Skull } from 'lucide-react';
import { TournamentStandings } from '@/components/tournament-standings';
import { TournamentReport } from '@/components/tournament-report';
import { MatchWinner } from '@/components/match-winner';
import { IntroTrailer } from '@/components/intro-trailer';
import { StartScreen } from '@/components/start-screen';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const { tournament, startTournament, resetTournament, currentMatch, gameWinner, isProcessing, playMatch, currentRound, simulateTournament, matchWinner, winner } = useTournament();
  const [introFinished, setIntroFinished] = useState(false);
  const [showTournamentWinner, setShowTournamentWinner] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePlayMatch = (pod1Move: Move, pod2Move) => {
    if (currentMatch) {
      playMatch(pod1Move, pod2Move);
    }
  };
  
  useEffect(() => {
    if (winner && !showTournamentWinner && !tournament?.finalMatch) {
        setShowTournamentWinner(true);
        const timer = setTimeout(() => {
            setShowTournamentWinner(false);
        }, 3900); // slightly less than the hook timeout
        return () => clearTimeout(timer);
    }
  }, [winner, tournament?.finalMatch, showTournamentWinner]);


  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration errors
  }

  if (!tournament) {
    if (!introFinished) {
        return <IntroTrailer onFinished={() => setIntroFinished(true)} />;
    }
    return <StartScreen onStartTournament={startTournament} isProcessing={isProcessing} />;
  }
  
  const isFinalBoss = currentMatch?.id === 'final-boss-match';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AnimatePresence>
        {matchWinner && (
          <MatchWinner winner={matchWinner.winner} winningMove={matchWinner.winningMove} isDraw={matchWinner.isDraw} />
        )}
        {showTournamentWinner && winner && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <Card className="w-full max-w-2xl text-center bg-card border-accent border-4">
                    <CardHeader>
                        <Trophy className="w-24 h-24 text-yellow-500 mx-auto" />
                        <p className="text-2xl font-medium text-accent uppercase tracking-widest">Round Robin Winner</p>
                        <CardTitle className="text-7xl font-black font-headline tracking-tighter text-primary">{winner.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl text-muted-foreground animate-pulse">Prepare for the Final Challenge!</p>
                    </CardContent>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>
      <Header>
        <div className="flex items-center gap-2">
            {!gameWinner && !isFinalBoss && !winner && currentMatch && (
                <Button variant="outline" size="sm" onClick={simulateTournament} disabled={isProcessing}>
                    <Swords className="mr-2" />
                    {isProcessing ? 'Simulating...' : 'Simulate All'}
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetTournament} disabled={isProcessing}>
                Reset
            </Button>
        </div>
      </Header>
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        {gameWinner ? (
          <div className="flex flex-grow items-center justify-center py-16">
            <Card className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 bg-card border-4 border-accent">
              <CardHeader>
                <p className="text-sm font-medium text-accent">
                    {gameWinner.id === 999 ? "The Boss Remains Undefeated" : "Ultimate Pod Champion"}
                </p>
                <CardTitle className="text-5xl font-bold font-headline tracking-tighter text-primary">{gameWinner.name}</CardTitle>
                <p className="text-muted-foreground">Managed by {gameWinner.manager}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
                  <span className="text-8xl">{gameWinner.emoji}</span>
                </div>
                 <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
                    {gameWinner.id === 999 ? (
                        <>
                            <Skull className="w-8 h-8" />
                            <span>Better Luck Next Time!</span>
                        </>
                    ) : (
                        <>
                            <Trophy className="w-8 h-8"/>
                            <span>Absolute Victory!</span>
                        </>
                    )}
                </div>
                <div className="flex w-full gap-4 mt-4">
                    <TournamentReport tournament={tournament} />
                    <Button size="lg" onClick={resetTournament} className="w-full">
                        Play Again
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start flex-grow">
             <div className="xl:col-span-2 h-full flex flex-col justify-center">
                {isFinalBoss && (
                     <Card className="mb-4 text-center border-destructive border-2 bg-destructive/10 p-2 animate-pulse">
                        <CardTitle className="text-destructive text-lg font-headline">FINAL BOSS BATTLE</CardTitle>
                        <CardDescription className="text-destructive/80">The Tournament Winner must face the ultimate challenge!</CardDescription>
                    </Card>
                )}
              <BattleArena
                key={currentMatch?.id}
                match={currentMatch}
                isProcessing={isProcessing}
                onPlayMatch={handlePlayMatch}
                roundNumber={currentRound}
              />
            </div>
            <div className="row-start-1 xl:row-auto h-full flex flex-col">
              <TournamentStandings standings={tournament.standings} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

    