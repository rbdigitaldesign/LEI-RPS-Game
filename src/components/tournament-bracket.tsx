
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
        <div className="relative w-full bg-card/50 border border-dashed border-primary/50 p-1 text-xs h-12 flex items-center">
            <div className={cn('font-bold text-primary', !match.winner && 'opacity-50')}>{pod1Name}</div>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-white/70">BYE</div>
        </div>
        <div className="w-4 border-b-2 border-primary/50"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center w-full">
      <div className={cn(
        "relative w-full bg-card border-2 border-primary/50 p-1 my-1 text-xs h-12 flex flex-col justify-around transition-all",
        isCurrent && "border-accent ring-2 ring-accent shadow-lg"
      )}>
        <div className={cn("flex justify-between items-center", isPod1Winner && "font-bold text-primary")}>
          <span>{pod1Name}</span>
        </div>
        <hr className="my-px border-primary/20" />
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
    <Card className="bg-card border-2 sticky top-20 overflow-x-auto">
      <CardHeader className="p-4">
        <CardTitle className="text-accent text-lg">Tournament Bracket</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${rounds.length}, 1fr)`}}>
          {rounds.map((round, roundIndex) => (
            <div key={round.id} className="flex flex-col items-center">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 truncate">
                {round.matches.length === 1 ? 'Final' : `Round ${round.id}`}
              </h3>
              <div className="flex flex-col justify-around w-full h-full" style={{ rowGap: `${(2 ** roundIndex -1) * 0.5}rem`}}>
                {round.matches.map((match) => (
                  <div key={match.id} className="relative flex items-center">
                    <MatchCard match={match} isCurrent={match.id === currentMatchId} />
                    {round.matches.length > 1 && roundIndex < rounds.length - 1 && (
                      <>
                        <div className="w-4 border-b-2 border-primary/50"></div>
                        <div 
                          className="absolute right-0 h-full w-4"
                          style={{
                            top: '50%',
                            height: `calc(100% * ${2 ** roundIndex} + ${(2 ** roundIndex -1) * 1}rem)`,
                          }}
                        >
                           <div className="h-full w-full border-r-2 border-b-2 border-primary/50 rounded-br-lg"></div>
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
