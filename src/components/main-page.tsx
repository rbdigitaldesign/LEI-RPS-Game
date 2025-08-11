
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useServerTournament } from '@/hooks/use-server-tournament';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Swords, Flame, Handshake, Bot } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { TournamentReport } from '@/components/tournament-report';
import { IntroTrailer } from '@/components/intro-trailer';
import { StartScreen } from '@/components/start-screen';
import { useToast } from '@/hooks/use-toast';
import type { TournamentState, Match } from '@/lib/types';
import Link from 'next/link';
import { PreIntroScreen } from './pre-intro-screen';
import { motion } from 'framer-motion';
import { getLiveCommentary } from '@/ai/flows/commentary-flow';

export function MainPageContent() {
  const searchParams = useSearchParams();
  const teamParam = searchParams?.get('team');
  
  const { tournament, startTournament, resetTournament, currentMatch, isProcessing, winner } = useServerTournament();
  const [preIntroFinished, setPreIntroFinished] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const lastTournamentState = useRef<TournamentState | null>(null);
  const [lastCompletedMatch, setLastCompletedMatch] = useState<Match | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [commentary, setCommentary] = useState<string>('');
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (sessionStorage.getItem('introSeen')) {
      setPreIntroFinished(true);
      setIntroFinished(true);
    }
  }, []);
  
  // Continuous commentary
  useEffect(() => {
    const generateCommentary = async () => {
      if (!tournament || isGeneratingCommentary) return;

      setIsGeneratingCommentary(true);
      try {
        const eliminatedTeamNames = tournament.rounds
          .flatMap(r => r.matches)
          .filter(m => m.loser)
          .map(m => m.loser!.name);

        const input = {
          currentMatch: tournament.currentMatchId 
            ? { pod1Name: currentMatch?.pod1?.name, pod2Name: currentMatch?.pod2?.name }
            : undefined,
          eliminatedTeamNames,
          winnerName: tournament.winner?.name,
        };

        const res = await getLiveCommentary(input);
        setCommentary(res.commentary);
      } catch (err) {
        console.error(err);
        setCommentary('The commentator seems to be taking a coffee break...');
      } finally {
        setIsGeneratingCommentary(false);
      }
    };
    
    // Generate commentary immediately and then on an interval
    generateCommentary();
    const commentaryInterval = setInterval(generateCommentary, 15000); // every 15 seconds

    return () => clearInterval(commentaryInterval);
  }, [tournament, currentMatch, isGeneratingCommentary]);


  // Detect ties and match results for the "Latest Result" card
  useEffect(() => {
    if (tournament && lastTournamentState.current) {
      const allCurrentMatches = tournament.rounds.flatMap((r) => r.matches);
      const allPreviousMatches = lastTournamentState.current.rounds.flatMap((r) => r.matches);

      const newlyCompleted = allCurrentMatches.filter(current => {
          if (!current.winner || current.isBye) return false;
          const previous = allPreviousMatches.find(p => p.id === current.id);
          return !previous || !previous.winner;
      });

      if (newlyCompleted.length > 0) {
        const lastMatch = newlyCompleted[newlyCompleted.length - 1];
        setIsTie(false);
        setLastCompletedMatch(lastMatch);
      }

      const currentMatchData = allCurrentMatches.find(m => m.id === tournament.currentMatchId);
      const previousMatchData = allPreviousMatches.find(m => m.id === tournament.currentMatchId);

      if (currentMatchData && previousMatchData && currentMatchData.moveHistory && previousMatchData.moveHistory) {
          if (currentMatchData.moveHistory.length > previousMatchData.moveHistory.length) {
              const latestRound = currentMatchData.moveHistory[currentMatchData.moveHistory.length - 1];
              if (latestRound.pod1 === latestRound.pod2) {
                  setIsTie(true);
                  setLastCompletedMatch(null); 
              }
          }
      }
    }
    if (tournament) {
      lastTournamentState.current = JSON.parse(JSON.stringify(tournament));
    }
  }, [tournament]);


  // Redirect to team page if team parameter is present
  useEffect(() => {
    if (isClient && teamParam) {
      window.location.href = `/team/${encodeURIComponent(teamParam)}`;
    }
  }, [isClient, teamParam]);
  
  const handleReset = () => {
    const password = prompt('Enter password to reset tournament:', '');
    if (password === 'orcas2025') {
      resetTournament();
    } else if (password !== null) {
      alert('Incorrect password.');
    }
  };

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration errors
  }

  if (teamParam) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Redirecting to Team Page...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!preIntroFinished) {
    return <PreIntroScreen onStart={() => {
        setPreIntroFinished(true);
        sessionStorage.setItem('introSeen', 'true');
    }} />;
  }
  
  if (!introFinished) {
    return <IntroTrailer onFinished={() => {
        setIntroFinished(true);
    }} />;
  }

  if (!tournament) {
    return <StartScreen onStartTournament={startTournament} isProcessing={isProcessing} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header>
        <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/teams">View Pods</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isProcessing}>
                Reset
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
                <p className="text-muted-foreground">Represented by {winner.manager}</p>
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
                    <Button size="lg" onClick={handleReset} className="w-full">
                        Play Again
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 items-start flex-grow">
            <div className="flex-grow w-full">
                <TournamentBracket rounds={tournament.rounds} currentMatchId={tournament.currentMatchId} />
            </div>
            <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Tournament in Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">
                    Teams are currently playing their matches. View the tournament bracket to see the current status.
                    {currentMatch && (
                      <span className="block mt-2">
                        Current Match: <strong>{currentMatch.pod1?.name}</strong> vs <strong>{currentMatch.pod2?.name}</strong>
                        {currentMatch.moveHistory && currentMatch.moveHistory.length > 0 && (
                          <span className="block mt-1 text-sm">
                            {currentMatch.moveHistory.filter((round: any) => round.pod1 === round.pod2).length > 0 && (
                              <span className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                                ⚠️ {currentMatch.moveHistory.filter((round: any) => round.pod1 === round.pod2).length} tie(s) occurred - teams playing again
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                  
                  {tournament && (() => {
                    const eliminatedTeams = tournament.rounds
                      .flatMap((r: any) => r.matches)
                      .filter((m: any) => m.winner && m.loser && !m.isBye)
                      .map((m: any) => m.loser)
                      .filter((team: any, index: number, arr: any[]) => 
                        arr.findIndex((t: any) => t.name === team.name) === index
                      );
                    
                    if (eliminatedTeams.length > 0) {
                      return (
                        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
                          <h4 className="font-medium text-red-200 mb-2">Eliminated Teams:</h4>
                          <div className="flex flex-wrap gap-2">
                            {eliminatedTeams.map((team: any) => (
                              <span 
                                key={team.name} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-300 rounded text-sm"
                              >
                                <span className="grayscale">{team.emoji}</span>
                                {team.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Card className="p-6 text-center">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Latest Result</CardTitle>
                  <CardDescription>The result of the most recent match appears here.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isTie ? (
                    <motion.div
                      key="tie"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="animate-in fade-in"
                    >
                      <Handshake className="w-16 h-16 text-yellow-500 mx-auto" />
                      <h3 className="text-5xl font-black font-headline tracking-tighter text-yellow-500 mt-2">DRAW</h3>
                      <p className="text-lg text-muted-foreground mt-2">A rematch is taking place!</p>
                    </motion.div>
                  ) : lastCompletedMatch?.winner ? (
                     <motion.div
                        key={lastCompletedMatch.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="animate-in fade-in"
                      >
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                      <p className="text-lg font-medium text-accent uppercase tracking-widest mt-2">Match Winner</p>
                      <h3 className="text-4xl font-black font-headline tracking-tight text-primary">{lastCompletedMatch.winner.name}</h3>
                      <div className="flex flex-col items-center space-y-4 pt-4">
                          <div className="relative w-32 h-32 border-4 border-primary bg-secondary flex items-center justify-center">
                          <span className="text-7xl">{lastCompletedMatch.winner.emoji}</span>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                              <p className="text-lg font-semibold">Defeated</p>
                              <div className="relative w-16 h-16 border-2 border-destructive bg-background flex items-center justify-center">
                                  <span className="text-4xl grayscale">{lastCompletedMatch.loser?.emoji}</span>
                              </div>
                              <p className="text-lg font-semibold capitalize text-destructive tracking-wide">{lastCompletedMatch.loser?.name}</p>
                          </div>
                      </div>
                    </motion.div>
                  ) : (
                      <div className="space-y-2">
                          <Flame className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
                          <p className="text-muted-foreground italic text-sm">Waiting for match result...</p>
                      </div>
                  )}
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bot />
                    LEI Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isGeneratingCommentary && !commentary ? (
                    <p className="text-muted-foreground italic animate-pulse">Commentator is thinking...</p>
                  ) : (
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{commentary || 'Waiting for the tournament to start...'}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
