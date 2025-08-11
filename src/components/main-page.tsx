
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useServerTournament } from '@/hooks/use-server-tournament';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Bot, Info, Handshake, Flame } from 'lucide-react';
import { TournamentBracket } from '@/components/tournament-bracket';
import { TournamentReport } from '@/components/tournament-report';
import { IntroTrailer } from '@/components/intro-trailer';
import { StartScreen } from '@/components/start-screen';
import type { TournamentState, Match } from '@/lib/types';
import Link from 'next/link';
import { PreIntroScreen } from './pre-intro-screen';
import { motion, AnimatePresence } from 'framer-motion';

const commentaryItems = [
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
  "The prize for winning this tournament is an upgrade to a working water tap on your level.",
  "The runner-up gets to explain pedagogy to the new VC.",
  "The champion gets to hear the VC try to explain pedagogy.",
  "Faculty have their own version of RPS — it’s called “Caught Between a Rock and a Hard Place.”",
  "The two VCs allegedly play RPS before every town hall to decide who gets the spicy questions.",
  "Fun fact: RPS is how blank spots in the org chart are filled.",
  "Coming soon: RPS v2.0 with DLC Bomb & Laser, plus “Sulking Because You Lost” mode.",
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
  "Today is World Rock Paper Scissors Day. Celebrated annually on August 27th. It's a day to enjoy the simple, yet globally recognised game and its role in decision-making and social interaction.",
  "This game dates back to the Han Dynasty in China, where it was called shoushiling.",
  "The original Chinese version featured animals like frog, slug, and snake instead of rock, paper, scissors.",
  "Japan adopted the game as sansukumi-ken, meaning “three afraid of each other.”",
  "One Japanese variation had a fox, a village headman, and a hunter as the three elements.",
  "Britain first heard of the game in 1924 under the name zhot.",
  "The US popularised the modern rock, paper, scissors format in the 1930s.",
  "In parts of the US, it’s called “Roshambo,” possibly named after a French general.",
  "In Japan, janken is still a go-to way to settle small disputes.",
  "The game often features in Japanese promotions and even drinking games.",
  "Today, RPS is recognised worldwide as the fastest way to make a decision."
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
  const { tournament, startTournament, resetTournament, isProcessing, winner } = useServerTournament();
  const [preIntroFinished, setPreIntroFinished] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const lastTournamentState = useRef<TournamentState | null>(null);
  const [lastCompletedMatch, setLastCompletedMatch] = useState<Match | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [commentaryQueue, setCommentaryQueue] = useState<string[]>([]);
  const [currentCommentaryIndex, setCurrentCommentaryIndex] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const welcomeMessage = "Welcome to the very first LEI RPS Pod Battle. Let's get ready to rumble!";
    setCommentaryQueue([welcomeMessage, ...shuffleArray([...commentaryItems])]);
    
    const skipIntroParam = searchParams?.get('skipIntro');

    if (sessionStorage.getItem('introSeen') || skipIntroParam === 'true') {
      setPreIntroFinished(true);
      setIntroFinished(true);
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (!tournament || winner || commentaryQueue.length === 0) return;

    const commentaryInterval = setInterval(() => {
      setCurrentCommentaryIndex(prevIndex => (prevIndex + 1) % commentaryQueue.length);
    }, 7000);

    return () => clearInterval(commentaryInterval);
  }, [tournament, winner, commentaryQueue.length]);

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
    return null;
  }

  if (teamParam) {
    return (
      <div className="flex flex-col min-h-screen">
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
    const skipIntroParam = searchParams?.get('skipIntro');
    if (skipIntroParam === 'true') {
        setPreIntroFinished(true);
    } else {
        return <PreIntroScreen onStart={() => { setPreIntroFinished(true); }} />;
    }
  }
  
  if (!introFinished) {
    return <IntroTrailer onFinished={() => { setIntroFinished(true); sessionStorage.setItem('introSeen', 'true'); }} />;
  }

  if (!tournament) {
    return <StartScreen onStartTournament={startTournament} isProcessing={isProcessing} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
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
      
      <main className="flex-grow p-4 flex flex-col">
        {winner ? (
          <div className="flex flex-grow items-center justify-center py-16">
            <Card className="w-full max-w-lg text-center animate-in fade-in zoom-in-95">
              <CardHeader>
                <p className="text-sm font-medium text-accent">
                    Ultimate Pod Champion
                </p>
                <CardTitle className="text-5xl font-headline tracking-tighter text-primary">{winner.name}</CardTitle>
                <p className="text-muted-foreground">Represented by {winner.manager}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center rounded-lg">
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
          <div className="flex flex-col xl:flex-row gap-6 items-start flex-grow">
            <div className="flex-grow w-full">
                <TournamentBracket rounds={tournament.rounds} currentMatchId={tournament.currentMatchId} />
            </div>
            <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6 container mx-auto xl:mx-0 xl:container-none">
              <Card className="p-4 md:p-6 text-center">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="font-headline text-[clamp(1.05rem,0.9rem+0.6vw,1.25rem)] font-semibold">Latest Result</CardTitle>
                  <CardDescription className="text-sm">The result of the most recent match appears here.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AnimatePresence mode="wait">
                  {isTie ? (
                    <motion.div
                      key="tie"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Handshake className="w-16 h-16 text-yellow-500 mx-auto" />
                      <h3 className="text-5xl font-bold tracking-tighter text-yellow-500 mt-2 font-headline">DRAW</h3>
                      <p className="text-lg text-muted-foreground mt-2">A rematch is taking place!</p>
                    </motion.div>
                  ) : lastCompletedMatch?.winner ? (
                      <motion.div
                        key={lastCompletedMatch.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                      <p className="text-lg font-medium text-accent uppercase tracking-widest mt-2">Match Winner</p>
                      <h3 className="text-4xl font-bold tracking-tight text-primary font-headline">{lastCompletedMatch.winner.name}</h3>
                      <div className="flex flex-col items-center space-y-4 pt-4">
                          <div className="relative w-32 h-32 border-4 border-primary bg-secondary flex items-center justify-center rounded-lg">
                          <span className="text-7xl">{lastCompletedMatch.winner.emoji}</span>
                          </div>
                          <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                              <p className="text-lg font-semibold">Defeated</p>
                              <div className="relative w-16 h-16 border-2 border-destructive bg-background flex items-center justify-center rounded-lg">
                                  <span className="text-4xl grayscale">{lastCompletedMatch.loser?.emoji}</span>
                              </div>
                              <p className="text-lg font-semibold capitalize text-destructive tracking-wide">{lastCompletedMatch.loser?.name}</p>
                          </div>
                      </div>
                    </motion.div>
                  ) : (
                      <motion.div key="waiting" className="space-y-2">
                          <Flame className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
                          <p className="text-muted-foreground italic text-sm">Waiting for match result...</p>
                      </motion.div>
                  )}
                  </AnimatePresence>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-headline">
                      <Info size={16}/>
                      Acknowledgements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Acknowledgement and sincere grattitude is given to Aaron Honson from the Media Team for their expertise in coding. This application was developed by Rich Bartlett using vibe coding methods in Firebase Studio in conjunction with Gemini AI. Informal user experience testing was conducted with the Orca Pod. Background music, 8-BIT BATTLE MUSIC, was sourced from Dragon Fren on SoundCloud.
                    </p>
                </CardContent>
            </Card>
            </div>
          </div>
        )}
      </main>

      {!winner && (
        <Card className="fixed bottom-4 left-4 w-80 max-w-[calc(100%-2rem)] p-4 z-50">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="font-headline flex items-center gap-2 text-sm font-semibold">
              <Bot size={16}/>
              LEI Commentary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 min-h-20 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentCommentaryIndex}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
                className="text-foreground italic text-center text-sm"
              >
                &ldquo;{commentaryQueue[currentCommentaryIndex]}&rdquo;
              </motion.p>
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
