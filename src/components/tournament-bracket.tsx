

'use client';

import type { Round, Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TournamentBracketProps = {
  rounds: Round[];
  currentMatchId: string | null;
};

const MatchCard = ({ match, isCurrent }: { match: Match; isCurrent: boolean }) => {
  const pod1Name = match.pod1?.name ?? 'TBD';
  const pod2Name = match.pod2?.name ?? 'TBD';
  const isPod1Winner = match.winner?.id === match.pod1?.id;
  const isPod2Winner = match.winner?.id === match.pod2?.id;

  if (match.isBye && match.pod1) {
    return (
      <div className="flex items-center w-full my-1">
        <div className="relative w-full bg-card/50 border border-dashed border-primary/50 p-1 text-[10px] h-8 flex items-center justify-between">
            <div className={cn('font-bold text-primary truncate', !match.winner && 'opacity-50')}>{pod1Name}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">BYE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center w-full my-1">
      <div className={cn(
        "relative w-full bg-card border border-primary/50 p-1 text-[10px] h-10 flex flex-col justify-around transition-all",
        isCurrent && "border-accent ring-1 ring-accent shadow-md"
      )}>
        <div className={cn("flex justify-between items-center truncate", isPod1Winner && "font-bold text-primary")}>
          <span className="truncate">{pod1Name}</span>
        </div>
        <hr className="my-px border-primary/20" />
        <div className={cn("flex justify-between items-center", isPod2Winner && "font-bold text-primary")}>
          <span className="truncate">{pod2Name}</span>
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
      <CardHeader className="p-2">
        <CardTitle className="text-accent text-base text-center">Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="flex justify-between">
          {rounds.map((round, roundIndex) => (
            <div key={round.id} className="flex flex-col justify-center w-full px-1">
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 text-center">
                {round.matches.length === 1 ? 'Final' : `Round ${round.id}`}
              </h3>
              <div className="flex flex-col justify-around h-full relative">
                {round.matches.map((match, matchIndex) => (
                  <div key={match.id} className={cn("relative", roundIndex < rounds.length - 1 ? 'pr-3' : '')}>
                    <MatchCard match={match} isCurrent={match.id === currentMatchId} />
                     {roundIndex < rounds.length - 1 && !match.isBye && (
                      <div className="absolute top-1/2 right-0 h-px w-3 bg-primary/50" />
                     )}
                     {roundIndex < rounds.length - 1 && matchIndex % 2 === 0 && (
                        <div 
                          className="absolute right-0 w-px bg-primary/50"
                          style={{
                            top: '25%',
                            height: '50%',
                          }}
                        />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

    