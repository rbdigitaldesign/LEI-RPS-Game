

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

  if (match.isBye) {
    return (
      <div className="flex items-center w-full">
        <div className="relative w-full bg-card/50 border border-dashed border-primary/50 p-1 text-[10px] h-10 flex items-center">
            <div className={cn('font-bold text-primary', !match.winner && 'opacity-50')}>{pod1Name}</div>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white/70">BYE</div>
        </div>
        <div className="w-2 border-b border-primary/50"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center w-full">
      <div className={cn(
        "relative w-full bg-card border border-primary/50 p-1 my-0.5 text-[10px] h-10 flex flex-col justify-around transition-all",
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
    <Card className="bg-card border-2 sticky top-20 overflow-x-auto">
      <CardHeader className="p-2">
        <CardTitle className="text-accent text-base text-center">Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid gap-x-2" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(100px, 1fr))`}}>
          {rounds.map((round, roundIndex) => (
            <div key={round.id} className="flex flex-col items-center">
              <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 truncate">
                {round.matches.length === 1 ? 'Final' : `Round ${round.id}`}
              </h3>
              <div className="flex flex-col justify-around w-full h-full space-y-1">
                {round.matches.map((match) => (
                  <div key={match.id} className="relative flex items-center">
                    <MatchCard match={match} isCurrent={match.id === currentMatchId} />
                     {roundIndex < rounds.length - 1 && (
                      <>
                        <div className="w-2 border-b border-primary/50"></div>
                        <div 
                          className="absolute right-0 h-full w-2"
                          style={{
                            top: '50%',
                            height: `calc(100% + 0.25rem)`,
                          }}
                        >
                           <div className="h-full w-full border-r border-b border-primary/50 rounded-br-sm"></div>
                        </div>
                      </>
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
