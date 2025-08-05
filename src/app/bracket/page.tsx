'use client';

import { useTournament } from '@/hooks/use-tournament';
import { TournamentBracket } from '@/components/tournament-bracket';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BracketPage() {
  const { tournament } = useTournament();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header>
        <Button asChild variant="outline">
          <Link href="/">Back to Battle</Link>
        </Button>
      </Header>
      <main className="flex-grow container mx-auto p-4">
        {tournament ? (
          <TournamentBracket tournament={tournament} currentMatchId={tournament.currentMatchId} />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">The tournament has not started yet.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
