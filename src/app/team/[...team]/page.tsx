// app/team/[...team]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useServerTournament } from '@/hooks/use-server-tournament';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveIcon } from '@/components/icons/move-icon';
import { MOVES, PODS } from '@/lib/constants';
import type { Move, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Swords, Check, Trophy, Hourglass } from 'lucide-react';
import { CommentaryBox } from '@/components/commentary-box';

// --- Hardening & Alias Glue ---
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const ALIASES: Record<string, string> = {
  'rakali': 'Rakalis',
  'capybara': 'Capybaras',
};
const CANON = new Map(PODS.map(p => [p.name.trim().toLowerCase(), p.name]));
CANON.set('cox travis', 'Cox Travis');

function resolveName(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (CANON.has(key)) return CANON.get(key)!;
  const aliased = ALIASES[key];
  if (aliased && CANON.has(aliased.toLowerCase())) return CANON.get(aliased.toLowerCase())!;
  return null;
}
// --- End Hardening ---

const PodDisplay = ({ pod, opponent, submitted }: { pod: Pod | null, opponent: Pod | null, submitted?: boolean }) => {
  if (!pod) return <div />;
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="w-32 h-32 bg-secondary rounded-lg flex items-center justify-center border-4 border-primary/50 relative">
          <span className="text-7xl">{pod.emoji}</span>
        </div>
      </motion.div>
      <h2 className="text-3xl font-bold mt-2 text-primary font-headline">{pod.name}</h2>
      <p className="text-sm text-muted-foreground">vs. {opponent?.name || '???'}</p>
      
      {submitted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-4 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
            <Check className="w-4 h-4"/>
            <span>Move Submitted!</span>
        </motion.div>
      )}
    </div>
  );
};

function TeamPageContent({ teamName }: { teamName: string }) {
  const { tournament, refetch } = useServerTournament();
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);
  
  const teamPod = PODS.find(p => p.name === teamName) || null;

  const currentMatch = tournament?.rounds
    .flatMap(r => r.matches)
    .find(m => m.id === tournament.currentMatchId && (m.pod1?.name === teamName || m.pod2?.name === teamName));
    
  const opponent = currentMatch?.pod1?.name === teamName ? currentMatch.pod2 : currentMatch?.pod1;
  const teamIsPod1 = currentMatch?.pod1?.name === teamName;
  const teamHasMoved = teamIsPod1 ? !!(currentMatch?.moves as any)?.pod1 : !!(currentMatch?.moves as any)?.pod2;

  const handleSubmitMove = async () => {
    if (!selectedMove) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'playMove', teamName, move: selectedMove })
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to submit move.');
      }
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (!isClient || !tournament) {
      return (
        <Card className="w-full max-w-lg text-center bg-card/50">
          <CardHeader>
            <Loader className="mx-auto h-12 w-12 animate-spin text-primary"/>
            <CardTitle>Loading Tournament...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while we fetch the latest tournament data.</p>
          </CardContent>
        </Card>
      );
    }

    if (tournament.winner) {
      return (
        <Card className="w-full max-w-lg text-center bg-card/50">
          <CardHeader>
            <Trophy className="mx-auto h-12 w-12 text-yellow-400"/>
            <CardTitle>Tournament Over!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl mb-2">The champion is <span className="font-bold text-primary">{tournament.winner.name}!</span></p>
          </CardContent>
        </Card>
      );
    }

    if (!currentMatch) {
      return (
        <Card className="w-full max-w-lg text-center bg-card/50">
          <CardHeader>
            <Hourglass className="mx-auto h-12 w-12 text-accent"/>
            <CardTitle>Waiting for your match...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your next match will appear here soon. The tournament is in progress.</p>
          </CardContent>
        </Card>
      );
    }

    if (teamHasMoved) {
      return (
        <Card className="w-full max-w-lg text-center bg-card/50">
          <CardHeader>
            <Check className="mx-auto h-12 w-12 text-green-400"/>
            <CardTitle>Move Submitted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You have submitted your move. Waiting for your opponent.</p>
            <Loader className="mx-auto h-6 w-6 animate-spin text-primary mt-4"/>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="w-full max-w-4xl text-center bg-card/80 backdrop-blur-sm border-2 border-primary/20">
        <CardHeader>
          <div className="text-center mb-2">
            <span className="text-sm font-bold text-accent px-2 py-1 bg-accent/10 rounded-full">Round {tournament.rounds.find(r => r.matches.some(m => m.id === currentMatch.id))?.id || '?'}</span>
          </div>
          <CardTitle className="text-4xl font-black text-primary font-headline">Rock Paper Scissors Battle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8">
            <PodDisplay pod={teamPod} opponent={opponent} submitted={teamHasMoved} />
            <p className="text-5xl font-black text-primary animate-pulse font-headline">VS</p>
            <PodDisplay pod={opponent} opponent={teamPod} />
          </div>
          <div className="mt-12">
            <h3 className="text-2xl font-bold font-headline mb-4">Choose Your Move</h3>
            <div className="flex justify-center gap-4">
              {MOVES.map((move) => (
                <motion.div key={move} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant={selectedMove === move ? 'default' : 'secondary'}
                    onClick={() => setSelectedMove(move)}
                    disabled={isSubmitting}
                    className={cn("w-32 h-32 flex flex-col gap-2 transition-all duration-200 border-4", selectedMove === move ? 'border-accent' : 'border-secondary')}
                  >
                    <MoveIcon move={move} className="text-5xl" />
                    <span className="font-bold uppercase text-sm tracking-wider">{move}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
            <Button onClick={handleSubmitMove} disabled={!selectedMove || isSubmitting} size="lg" className="mt-8 w-full max-w-xs font-bold text-lg">
              {isSubmitting ? <Loader className="animate-spin mr-2" /> : <Swords className="mr-2" />}
              Confirm Move
            </Button>
            {error && <p className="text-destructive mt-4">{error}</p>}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-4xl">{teamPod?.emoji}</span>
          <div className="flex flex-col text-left">
            <span className="font-bold">{teamName}</span>
            <span className="text-xs text-muted-foreground">Pod Interface</span>
          </div>
        </div>
      </Header>
      <main className="flex-grow flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div key={currentMatch?.id || 'waiting'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      <CommentaryBox show={true} />
    </div>
  );
}

type Props = { params: { team?: string[] } };

export default function TeamPage({ params }: Props) {
  const segs = params.team ?? [];
  const raw = decodeURIComponent((segs[0] ?? '').trim());
  const name = resolveName(raw);
  if (!name) return notFound();
  
  return <TeamPageContent teamName={name} />;
}
