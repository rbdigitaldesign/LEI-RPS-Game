'use client';

import type { Round, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type TournamentBracketProps = {
  rounds: Round[];
  currentMatchId: string | null;
};

const MatchCard = ({ match, isCurrent }: { match: Match, isCurrent: boolean }) => {
  const pod1Name = match.pod1?.name ?? 'TBD';
  const pod2Name = match.pod2?.name ?? 'TBD';
  const isPod1Winner = match.winner?.id === match.pod1?.id;
  const isPod2Winner = match.winner?.id === match.pod2?.id;

  if (match.isBye) {
    return (
      <div className="flex flex-col justify-center min-h-[60px] text-xs">
        <div className="relative w-full bg-card border-2 border-primary/50 p-1 my-1">
          <div className={cn("font-bold text-primary")}>
            <span>{pod1Name}</span>
          </div>
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold uppercase tracking-widest">BYE</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center min-h-[60px] text-xs">
      <div className={cn(
        "relative w-full bg-card border-2 border-primary/50 p-1 my-1 transition-all",
        isCurrent && "border-accent ring-2 ring-accent shadow-lg"
      )}>
        <div className={cn("flex justify-between items-center", isPod1Winner && "font-bold text-primary")}>
          <span>{pod1Name}</span>
        </div>
        <hr className="my-1 border-primary/20" />
        <div className={cn("flex justify-between items-center", isPod2Winner && "font-bold text-primary")}>
          <span>{pod2Name}</span>
        </div>
      </div>
    </div>
  );
};

export function TournamentBracket({ rounds, currentMatchId }: TournamentBracketProps) {
  if (!rounds || rounds.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-2 sticky top-20">
      <CardHeader className="p-4">
        <CardTitle className="text-accent text-lg">Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-4 pb-4">
            {rounds.map((round, roundIndex) => (
                <div key={round.id} className="flex flex-col space-y-2 items-center min-w-[150px]">
                <h3 className="text-base font-bold text-primary uppercase tracking-wider">
                    {round.matches.length === 1 ? 'Final' : `Round ${round.id}`}
                </h3>
                <div className="flex flex-col justify-around h-full space-y-4 w-full">
                    {round.matches.map((match) => (
                        <div key={match.id} className="flex items-center">
                            <MatchCard match={match} isCurrent={match.id === currentMatchId} />
                            {round.matches.length > 1 && roundIndex < rounds.length - 1 && (
                                <div className="w-8 border-t-2 border-primary/50"></div>
                            )}
                        </div>
                    ))}
                </div>
                </div>
            ))}
            </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
