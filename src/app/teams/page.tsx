
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PODS } from '@/lib/constants';
import { Users, ArrowLeft, Bot } from 'lucide-react';
import { useServerTournament } from '@/hooks/use-server-tournament';
import Link from 'next/link';

export default function TeamsPage() {
  const { tournament, startTournament, resetTournament, isProcessing } = useServerTournament();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleReset = () => {
    const enteredPassword = prompt('Enter password to reset tournament:', '');
    if (enteredPassword === 'orcas2025') {
      resetTournament();
      startTournament();
    } else if (enteredPassword !== null) {
      alert('Incorrect password.');
    }
  };

  if (!isClient) {
 return null;
  }
  
  const getTeamStatus = (teamName: string) => {
    if (!tournament) return 'waiting';
    
    if (tournament.winner) {
      return tournament.winner.name === teamName ? 'winner' : 'eliminated';
    }

    const currentMatch = tournament.rounds
      .flatMap(r => r.matches)
      .find(m => 
        m.id === tournament.currentMatchId && 
        !m.isBye && 
        (m.pod1?.name === teamName || m.pod2?.name === teamName)
      );

    if (currentMatch) {
      const teamIsPod1 = currentMatch.pod1?.name === teamName;
      const teamMove = teamIsPod1 ? (currentMatch.moves as any)?.pod1 : (currentMatch.moves as any)?.pod2;
      
      if (teamMove) {
        return 'waiting-opponent';
      } else {
        return 'playing';
      }
    }

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
        return <span className="bg-green-500/20 text-green-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">🎮 Playing Now</span>;
      case 'waiting-opponent':
        return <span className="bg-yellow-500/20 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">⏳ Move Submitted</span>;
      case 'waiting-turn':
        return <span className="bg-blue-500/20 text-blue-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">⏰ Waiting Turn</span>;
      case 'eliminated':
        return <span className="bg-red-500/20 text-red-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">❌ Eliminated</span>;
      case 'winner':
        return <span className="bg-yellow-400/30 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">🏆 Champion</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-700 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">⏳ Not Started</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
                <Link href="/?skipIntro=true"><ArrowLeft/> Back to Tournament</Link>
            </Button>
          {!tournament ? (
            <Button onClick={startTournament} disabled={isProcessing}>
              {isProcessing ? 'Starting...' : 'Start Tournament'}
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleReset} disabled={isProcessing}>
              {isProcessing ? 'Resetting...' : 'Reset Tournament'}
            </Button>
          )}
        </div>
      </Header>
      
      <main className="flex-grow container mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Users/> Pod Battleground</h1>
          <p className="text-muted-foreground">
            Select a pod below to access their match interface, or view the tournament overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PODS.map((pod) => {
            const status = getTeamStatus(pod.name);
            const canPlay = status === 'playing';
            
            return (
              <Card key={pod.name} className={`transition-all hover:shadow-lg ${canPlay ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{pod.emoji}</span>
                    <div>
                      <CardTitle className="text-lg">{pod.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Represented by {pod.manager}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between">
                  {getStatusBadge(status)}
                  <Button 
                    asChild
                    variant={canPlay ? "default" : "outline"}
                    size="sm"
                  >
                    <a href={`/team/${encodeURIComponent(pod.name)}`} target="_blank" rel="noopener noreferrer">
                      {canPlay ? 'Play Now!' : 'Team Page'}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {/* Special card for the AI bot */}
          <Card className="transition-all hover:shadow-lg border-dashed">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🤖</span>
                <div>
                  <CardTitle className="text-lg">Cox Travis</CardTitle>
                  <p className="text-sm text-muted-foreground">Represented by The AI</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between">
              {getStatusBadge(getTeamStatus('Cox Travis'))}
              <Button 
                variant="secondary"
                size="sm"
                disabled
              >
                <Bot className="mr-2 h-4 w-4" />
                Bot
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
