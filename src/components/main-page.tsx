
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
import { motion, AnimatePresence } from 'framer-motion';

const commentaryJokes = [
  "Quick reminder folks: your next payday is Thursday 4 September.",
  "Hey Media pod, what is the charge? Throwing a rock? A succulent Chinese rock?!",
  "Hey Media pod, just get your press secretary to win this tournament so you can all relax.",
  "Hey Dolphin pod, is anyone wishing they could be playing Magic: The Gathering right now?",
  "Dolphin pod, please don’t performance manage anyone if they lose.",
  "Wombat pod, if you’re struggling, just tell the hosts you’ve got network issues from your “remote” workplace.",
  "Wombat pod, longing for Smart Storyboard yet?",
  "Panda Pod, if you’re having issues with this tournament, log a ticket with MyUni support.",
  "Octopod, the only team whose name also sounds like an occupation.",
  "Octopod, remember — no OH&S breaches from rocks or scissors here.",
  "Owl pod, parliament now in session.",
  "Alpacas pod… or whatever name you’re going by this week.",
  "If you think this activity is pointless, try a VC town hall.",
  "The beauty of RPS is these are three things impossible to merge… State Government, hold my beer.",
  "Can someone explain RPS to the newbies? BFFR.",
  "The chances of winning RPS are about the same as a new AU student dropping out.",
  "These jokes are authorised by the Integration Management Office.",
  "This tournament is sponsored by the NTEU… unless you’re not a member.",
  "The prize is an upgrade to a working water tap on your level.",
  "The runner-up gets to explain pedagogy to the new VC.",
  "The champion gets to hear the VC try to explain pedagogy.",
  "Faculty have their own version of RPS — it’s called “Caught Between a Rock and a Hard Place.”",
  "The two VCs allegedly play RPS before every town hall to decide who gets the spicy questions.",
  "Fun fact: RPS is how blank spots in the org chart are filled.",
  "Coming soon: RPS v2.0 with DLC Bomb & Laser, plus “Sulking Because You Lost” mode.",
  "If you take issue with my comments, go to HR — I can’t be fired because I don’t exist!",
  "In this tournament, rock is strong, steady, and impossible to fit into the stationery drawer.",
  "Paper remains the stationery cupboard’s pride and joy.",
  "Scissors will always be the craft cupboard’s secret weapon.",
  "Double paper? That’s just two people trying to book the same meeting room.",
  "Double scissors — the official handshake of this tournament.",
  "A bold paper throw is always a “low-risk” strategy.",
  "Rock is the geological veteran of the game.",
  "Paper is the recycling bin’s favourite champion.",
  "Scissors are the go-to choice for anyone who’s been near the craft supplies lately.",
  "Some players swear by rock, others by paper, others by scissors… and some just pick randomly every time.",
  "If you see a lot of scissors, it might be time to check the supply cupboard.",
  "In this tournament, paper loves to wrap up rock like an urgent memo.",
  "Rock and paper is the ultimate underdog story.",
  "Scissors versus paper is the original “deadline cuts into lunch break” moment.",
  "This is the only competition where stationery and geology collide.",
  "RPS: the game where strategy meets chaos… and chaos usually wins.",
  "This competition could go anywhere — except for a draw with rock, paper, and scissors all at once.",
  "Remember: in this tournament, even the simplest throw can change your fate.",
  "If I got paid to play rock-paper-scissors, I’d be making money hand over fist.",
  "The Rock said he could beat any wrestler; I asked, “What about one named Paper?”",
  "Make stone scissors to cut paper — call them Rock Paper Scissors.",
  "If a tree beats a rock in the forest, does anyone look for broken scissors?",
  "Rock music always beats Scissors’ sister — at least on Paper.",
  "Walk around the office with scissors and literally cut ties with coworkers.",
  "Whoever keeps stealing my scissors needs to cut it out.",
  "Won RPS with a cop — he said “Papers,” I said “Scissors” and drove off.",
  "Rap is like scissors — it always loses to rock.",
  "Remember: changing your throw every round keeps your opponent guessing.",
  "Going for rock three times in a row? Bold move.",
  "The paper-first strategy works… until it doesn’t.",
  "Never underestimate the psychological power of a well-timed scissor throw.",
  "Some say starting with rock sends a message — but is it the right one?",
  "A mixed pattern keeps your opponent on their toes.",
  "If you’ve thrown paper twice, they’re expecting scissors… or are they?",
  "Rock is reliable, but too much of it is just predictable geology.",
  "Paper is the stealthiest throw — it looks harmless until it wins.",
  "Scissors are for the confident and the crafty.",
  "The perfect throw is the one they least expect.",
  "The key to victory? Confidence… and maybe a little luck.",
  "Sometimes it’s less about what you throw, and more about what they think you’ll throw.",
  "Reverse psychology is risky — unless your opponent is overthinking too.",
  "Balance your throws — too much of one is an open book.",
  "It’s not cheating if you win with style.",
  "Don’t let one loss shake your next throw.",
  "Paper to open, scissors to close — it’s a classic.",
  "Rock, paper, scissors — the eternal cycle of triumph and defeat.",
  "Today is World Rock Paper Scissors Day. Celebrated annually on August 27th. It's a day to enjoy the simple, yet globally recognised game and its role in decision-making and social interaction."
];

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

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
  const [shuffledJokes, setShuffledJokes] = useState<string[]>([]);
  const [commentaryIndex, setCommentaryIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
    setShuffledJokes(shuffleArray([...commentaryJokes]));
    if (sessionStorage.getItem('introSeen')) {
      setPreIntroFinished(true);
      setIntroFinished(true);
    }
  }, []);
  
  // Joke slideshow
  useEffect(() => {
    if (!tournament || winner || shuffledJokes.length === 0) return;

    const commentaryInterval = setInterval(() => {
      setCommentaryIndex(prevIndex => (prevIndex + 1) % shuffledJokes.length);
    }, 7000); // Change joke every 7 seconds

    return () => clearInterval(commentaryInterval);
  }, [tournament, winner, shuffledJokes.length]);


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
                  <CardDescription className="text-xs pt-2">
                    These comments aren’t live match updates — just safe, evergreen banter to keep the tournament fun for everyone
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 min-h-24 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={commentaryIndex}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.5 }}
                      className="text-foreground text-lg italic text-center"
                    >
                      &ldquo;{shuffledJokes[commentaryIndex]}&rdquo;
                    </motion.p>
                  </AnimatePresence>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
