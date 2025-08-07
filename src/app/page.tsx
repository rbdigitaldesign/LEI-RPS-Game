
'use client';

import { useState, useEffect } from 'react';
import { useTournament } from '@/hooks/use-tournament';
import { Button } from '@/components/ui/button';
import { BattleArena } from '@/components/battle-arena';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Move } from '@/lib/types';
import { Trophy } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { TournamentReport } from '@/components/tournament-report';
import { IntroTrailer } from '@/components/intro-trailer';
import { StartScreen } from '@/components/start-screen';

export default function Home() {
  const { tournament, startTournament, resetTournament, currentMatch, isProcessing, playMatch, currentRound, winner } = useTournament();
  const [introFinished, setIntroFinished] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePlayMatch = (pod1Move: Move, pod2Move: Move) => {
    if (currentMatch) {
      playMatch(pod1Move, pod2Move);
    }
  };
  
  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration errors
  }

  if (!tournament) {
    if (!introFinished) {
        return <IntroTrailer onFinished={() => setIntroFinished(true)} />;
    }
    return <StartScreen onStartTournament={startTournament} isProcessing={isProcessing} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetTournament} disabled={isProcessing}>
                Reset tournament
            </Button>
        </div>
      </Header>
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        {winner ? (
          <div className="flex flex-grow items-center justify-center py-16">
            <Card className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 bg-card border-4 border-accent">
              <CardHeader>
                <p className="text-sm font-medium text-accent">
                    Ultimate Pod Champion
                </p>
                <CardTitle className="text-5xl font-bold font-headline tracking-tighter text-primary">{winner.name}</CardTitle>
                <p className="text-muted-foreground">Managed by {winner.manager}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
                  <span className="text-8xl">{winner.emoji}</span>
                </div>
                 <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
                    <Trophy className="w-8 h-8"/>
                    <span>Absolute Victory!</span>
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
          <div className="flex flex-col gap-4 items-start flex-grow">
            <TournamentBracket rounds={tournament.rounds} />
             <div className="w-full flex flex-col gap-4">
              <BattleArena
                key={currentMatch?.id}
                match={currentMatch}
                isProcessing={isProcessing}
                onPlayMatch={handlePlayMatch}
                roundNumber={currentRound}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
