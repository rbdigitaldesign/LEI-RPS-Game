import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TournamentState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, Check } from 'lucide-react';

type TournamentBracketProps = {
  tournament: TournamentState;
  currentMatchId?: string;
};

export function TournamentBracket({ tournament, currentMatchId }: TournamentBracketProps) {
  if (!tournament) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardContent className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-center font-headline">Tournament Bracket</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {tournament.rounds.map((round, roundIndex) => (
              <div key={round.id} className="flex flex-col gap-6 min-w-[250px]">
                <h3 className="text-xl font-semibold text-center text-primary">
                  Round {roundIndex + 1}
                </h3>
                <div className="space-y-6">
                  {round.matches.map((match) => (
                    <Card
                      key={match.id}
                      className={cn(
                        'p-3 transition-all bg-card/80',
                        match.id === currentMatchId && 'ring-2 ring-accent shadow-lg'
                      )}
                    >
                      <div className="space-y-2">
                        <div
                          className={cn(
                            'flex justify-between items-center',
                            match.winner?.id === match.pod1?.id && 'font-bold text-primary',
                            match.loser?.id === match.pod1?.id && 'text-muted-foreground line-through'
                          )}
                        >
                          <span>{match.pod1?.name ?? 'TBD'}</span>
                          {match.winner?.id === match.pod1?.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        
                        {match.isBye ? (
                            <div className="text-center">
                                <Badge variant="secondary">BYE</Badge>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                'flex justify-between items-center',
                                match.winner?.id === match.pod2?.id && 'font-bold text-primary',
                                match.loser?.id === match.pod2?.id && 'text-muted-foreground line-through'
                                )}
                            >
                                <span>{match.pod2?.name ?? 'TBD'}</span>
                                {match.winner?.id === match.pod2?.id && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {tournament.winner && (
                 <div className="flex flex-col gap-6 min-w-[250px] items-center">
                    <h3 className="text-xl font-semibold text-center text-primary">
                        Winner
                    </h3>
                    <Card className="p-4 ring-2 ring-primary bg-secondary/80">
                        <div className="flex flex-col items-center gap-2 text-center">
                           <Trophy className="w-10 h-10 text-primary" />
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
