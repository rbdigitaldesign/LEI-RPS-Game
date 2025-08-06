
'use client';

import { useState } from 'react';
import { useTournament } from '@/hooks/use-tournament';
import { Button } from '@/components/ui/button';
import { BattleArena } from '@/components/battle-arena';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Move } from '@/lib/types';
import { Trophy, Swords, Shield, Skull } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { TournamentReport } from '@/components/tournament-report';
import { MatchWinner } from '@/components/match-winner';
import { IntroTrailer } from '@/components/intro-trailer';
import { StartScreen } from '@/components/start-screen';

export default function Home() {
  const { tournament, startTournament, resetTournament, currentMatch, gameWinner, isProcessing, playMatch, currentRound, simulateTournament, matchWinner } = useTournament();
  const [introFinished, setIntroFinished] = useState(false);

  const handlePlayMatch = (pod1Move: Move, pod2Move: Move) => {
    if (currentMatch) {
      playMatch(pod1Move, pod2Move);
    }
  };

  if (!tournament) {
    if (!introFinished) {
        return <IntroTrailer onFinished={() => setIntroFinished(true)} />;
    }
    return <StartScreen onStartTournament={startTournament} isProcessing={isProcessing} />;
  }
  
  const isFinalBoss = currentMatch?.id === 'final-boss-match';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {matchWinner && matchWinner.winner && matchWinner.winningMove && (
        <MatchWinner winner={matchWinner.winner} winningMove={matchWinner.winningMove} />
      )}
      <Header>
        <div className="flex items-center gap-2">
            {!gameWinner && !isFinalBoss && (
                <Button variant="outline" size="sm" onClick={simulateTournament} disabled={isProcessing}>
                    <Swords className="mr-2" />
                    {isProcessing ? 'Simulating...' : 'Simulate'}
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={resetTournament} disabled={isProcessing}>
                Reset
            </Button>
        </div>
      </Header>
      <main className="flex-grow container mx-auto p-4 space-y-8">
        {gameWinner ? (
          <div className="flex items-center justify-center py-16">
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
             <div className="xl:col-span-2">
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
            <div className="row-start-1 xl:row-auto">
              <TournamentBracket rounds={tournament.rounds} currentMatchId={tournament.currentMatchId} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
