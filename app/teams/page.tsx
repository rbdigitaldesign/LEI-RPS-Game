
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PODS } from '@/lib/constants';
import { Users, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { useServerTournament } from '@/hooks/use-server-tournament';
import Link from 'next/link';

export default function TeamsPage() {
  const { tournament, startTournament, resetTournament, isProcessing } = useServerTournament();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const getTeamStatus = (teamName: string) => {
    if (!tournament) return 'waiting';
    
    if (tournament.winner) {
      return tournament.winner.name === teamName ? 'winner' : 'eliminated';
    }

    // Check if team has a current match
    const currentMatch = tournament.rounds
      .flatMap(r => r.matches)
      .find(m => 
        m.id === tournament.currentMatchId && 
        !m.isBye && 
        (m.pod1?.name === teamName || m.pod2?.name === teamName)
      );

    if (currentMatch) {
      const teamIsPod1 = currentMatch.pod1?.name === teamName;
      const teamMove = teamIsPod1 ? currentMatch.moves?.pod1 : currentMatch.moves?.pod2;
      
      if (teamMove) {
        return 'waiting-opponent';
      } else {
        return 'playing';
      }
    }

    // Check if team is eliminated
    const isEliminated = tournament.rounds
      .flatMap(r => r.matches)
      .some(m => m.loser?.name === teamName);

    if (isEliminated) {
      return 'eliminated';
    }

    return 'waiting-turn';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'playing':
        return <span className="bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">🎮 Playing Now</span>;
      case 'waiting-opponent':
        return <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">⏳ Move Submitted</span>;
      case 'waiting-turn':
        return <span className="bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">⏰ Waiting Turn</span>;
      case 'eliminated':
        return <span className="bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">❌ Eliminated</span>;
      case 'winner':
        return <span className="bg-yellow-400 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">🏆 Champion</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">⏳ Not Started</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href="/"><ArrowLeft/> Back to Bracket</Link>
            </Button>
          {!tournament ? (
            <Button onClick={startTournament} disabled={isProcessing}>
              {isProcessing ? 'Starting...' : 'Start Tournament'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={resetTournament} disabled={isProcessing}>
              {isProcessing ? 'Resetting...' : 'Reset Tournament'}
            </Button>
          )}
        </div>
      </Header>
      
      <main className="flex-grow container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Users/> Team Directory</h1>
          <p className="text-muted-foreground">
            Select a team below to access their match interface, or view the tournament overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PODS.map((pod) => {
            const status = getTeamStatus(pod.name);
            const canPlay = status === 'playing';
            
            return (
              <Card key={pod.name} className={`transition-all hover:shadow-lg ${canPlay ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{pod.emoji}</span>
                      <div>
                        <CardTitle className="text-lg">{pod.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Managed by {pod.manager}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(status)}
                    <Button 
                      asChild
                      variant={canPlay ? "default" : "outline"}
                      size="sm"
                    >
                      <a href={`/team/${encodeURIComponent(pod.name)}`}>
                        {canPlay ? 'Play Now!' : 'Team Page'}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
