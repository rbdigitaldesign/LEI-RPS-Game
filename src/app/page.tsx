'use client';

import { useTournament } from '@/hooks/use-tournament';
import { Button } from '@/components/ui/button';
import { TournamentBracket } from '@/components/tournament-bracket';
import { BattleArena } from '@/components/battle-arena';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Move } from '@/lib/types';

export default function Home() {
  const { tournament, startTournament, resetTournament, currentMatch, winner, isProcessing, playMatch } = useTournament();

  const handlePlayMatch = (pod1Move: Move, pod2Move: Move) => {
    if (currentMatch) {
      playMatch(pod1Move, pod2Move);
    }
  };


  if (!tournament) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-bold font-headline">RPS Pod Battle</CardTitle>
              <CardDescription className="text-lg">The ultimate rock, paper, scissors showdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                LEI Monthly Meeting — 27th August 2025
              </p>
              <Button size="lg" onClick={startTournament} className="w-full text-lg" disabled={isProcessing}>
                {isProcessing ? 'Setting Up...' : 'Start Tournament'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header>
        <Button variant="outline" size="sm" onClick={resetTournament} disabled={isProcessing}>
          Reset Tournament
        </Button>
      </Header>
      <main className="flex-grow container mx-auto p-4 space-y-8">
        {winner ? (
          <div className="flex items-center justify-center py-16">
            <Card className="w-full max-w-lg text-center shadow-2xl animate-in fade-in zoom-in-95 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <p className="text-sm font-medium text-primary">Tournament Winner</p>
                <CardTitle className="text-5xl font-bold font-headline tracking-tighter">{winner.name}</CardTitle>
                <p className="text-muted-foreground">Managed by {winner.manager}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-secondary flex items-center justify-center">
                  <span className="text-8xl">{winner.emoji}</span>
                </div>
                <p className="text-2xl font-semibold">Congratulations!</p>
                <Button size="lg" onClick={resetTournament} className="w-full">
                  Play Again
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <BattleArena
              key={currentMatch?.id}
              match={currentMatch}
              isProcessing={isProcessing}
              onPlayMatch={handlePlayMatch}
            />
            <TournamentBracket tournament={tournament} currentMatchId={currentMatch?.id} />
          </>
        )}
      </main>
    </div>
  );
}
