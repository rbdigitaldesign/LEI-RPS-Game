'use client';

import { useTournament } from '@/hooks/use-tournament';
import { Button } from '@/components/ui/button';
import { BattleArena } from '@/components/battle-arena';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Move } from '@/lib/types';
import { Trophy } from 'lucide-react';
import { TournamentReport } from '@/components/tournament-report';
import { TournamentBracket } from '@/components/tournament-bracket';

export default function Home() {
  const { tournament, startTournament, resetTournament, currentMatch, winner, isProcessing, playMatch, currentRound } = useTournament();

  const handlePlayMatch = (pod1Move: Move, pod2Move: Move) => {
    if (currentMatch) {
      playMatch(pod1Move, pod2Move);
    }
  };

  if (!tournament) {
    return (
      <div className="flex flex-col min-h-screen bg-hero-pattern bg-cover bg-center bg-fixed">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center bg-black/80 backdrop-blur-sm border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-3xl font-bold font-headline text-accent">RPS Pod Battle</CardTitle>
              <CardDescription className="text-sm text-primary leading-relaxed">The ultimate rock, paper, scissors showdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-xs">
                LEI Monthly Meeting — 27th August 2025
              </p>
              <Button size="lg" onClick={startTournament} className="w-full text-lg" disabled={isProcessing}>
                {isProcessing ? 'Loading...' : 'Start Tournament'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetTournament} disabled={isProcessing}>
                Reset
            </Button>
        </div>
      </Header>
      <main className="flex-grow container mx-auto p-4 space-y-8">
        {winner ? (
          <div className="flex items-center justify-center py-16">
            <Card className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 bg-card border-4 border-accent">
              <CardHeader>
                <p className="text-sm font-medium text-accent">Tournament Winner</p>
                <CardTitle className="text-5xl font-bold font-headline tracking-tighter text-primary">{winner.name}</CardTitle>
                <p className="text-muted-foreground">Managed by {winner.manager}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
                  <span className="text-8xl">{winner.emoji}</span>
                </div>
                 <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
                    <Trophy className="w-8 h-8"/>
                    <span>Congratulations!</span>
                </div>
                <div className="flex w-full gap-2">
                    <Button size="lg" onClick={resetTournament} className="w-full">
                        Play Again
                    </Button>
                    {winner && <TournamentReport tournament={tournament} />}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            <BattleArena
              key={currentMatch?.id}
              match={currentMatch}
              isProcessing={isProcessing}
              onPlayMatch={handlePlayMatch}
              roundNumber={currentRound}
            />
            {tournament && <TournamentBracket rounds={tournament.rounds} currentMatchId={tournament.currentMatchId} />}
          </div>
        )}
      </main>
    </div>
  );
}
