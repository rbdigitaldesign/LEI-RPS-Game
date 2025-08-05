import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TournamentState, Match } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, Check } from 'lucide-react';

type TournamentBracketProps = {
  tournament: TournamentState;
  currentMatchId?: string | null;
};

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Match['pod1'], isWinner?: boolean, isLoser?: boolean }) => {
  if (!pod) {
    return <div className="p-2 text-muted-foreground/50">TBD</div>;
  }
  return (
    <div
      className={cn(
        'flex justify-between items-center p-2 transition-all',
        isWinner && 'font-bold text-primary',
        isLoser && 'text-muted-foreground line-through opacity-70'
      )}
    >
      <span>{pod.emoji} {pod.name}</span>
      {isWinner && <Check className="w-4 h-4 text-green-500" />}
    </div>
  );
};

const BracketMatch = ({ match, isCurrent }: { match: Match, isCurrent?: boolean }) => {
  return (
    <div className={cn('bg-card/80 border w-full', isCurrent && 'ring-2 ring-accent')}>
      <BracketPod pod={match.pod1} isWinner={match.winner?.id === match.pod1?.id} isLoser={!!match.winner && match.winner?.id !== match.pod1?.id} />
      {match.isBye ? (
        <div className="text-center py-2 border-t">
            <Badge variant="secondary">BYE</Badge>
        </div>
      ) : (
        <>
            <div className="border-t text-xs h-6 flex items-center justify-center text-muted-foreground">VS</div>
            <BracketPod pod={match.pod2} isWinner={match.winner?.id === match.pod2?.id} isLoser={!!match.winner && match.winner?.id !== match.pod2?.id} />
        </>
      )}
    </div>
  );
}


export function TournamentBracket({ tournament, currentMatchId }: TournamentBracketProps) {
  if (!tournament) return null;

  return (
    <Card className="bg-card border-2">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center font-headline text-accent">Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex justify-start items-center p-4">
            {tournament.rounds.map((round, roundIndex) => (
              <div key={round.id} className="flex flex-col items-center justify-center gap-12" style={{minWidth: 280}}>
                <h3 className="text-xl font-semibold text-center text-primary">
                  Round {roundIndex + 1}
                </h3>
                <div className="flex flex-col justify-center items-center gap-12 w-full">
                  {round.matches.map((match, matchIndex) => {
                    const isFinalMatchOfRoundPair = matchIndex % 2 === 1;
                    return (
                        <div key={match.id} className="flex items-center justify-center relative w-full">
                            <BracketMatch match={match} isCurrent={match.id === currentMatchId} />

                            {isFinalMatchOfRoundPair && tournament.rounds[roundIndex+1] && (
                                <div className="absolute left-full top-1/2 w-8 h-px bg-border -translate-y-1/2"></div>
                            )}

                             {roundIndex < tournament.rounds.length - 1 && (
                                <>
                                  <div className="absolute left-full top-1/2 w-4 h-px bg-border -translate-y-1/2"></div>
                                  <div className={cn(
                                    "absolute left-full w-px bg-border",
                                    matchIndex % 2 === 0 ? "h-1/2 top-1/2" : "h-1/2 bottom-1/2",
                                    (round.matches.length % 2 === 1 && matchIndex === round.matches.length - 1) && "h-0"
                                  )}></div>
                                </>
                             )}
                        </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {tournament.winner && (
                 <div className="flex flex-col gap-6 min-w-[280px] items-center">
                    <h3 className="text-xl font-semibold text-center text-primary">
                        Winner
                    </h3>
                    <Card className="p-4 ring-2 ring-primary bg-secondary/80 w-full max-w-[280px]">
                        <div className="flex flex-col items-center gap-2 text-center">
                           <Trophy className="w-10 h-10 text-yellow-500" />
                           <p className="text-lg font-bold">{tournament.winner.name}</p>
                           <p className="text-sm text-muted-foreground">Managed by {tournament.winner.manager}</p>
                        </div>
                    </Card>
                 </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
