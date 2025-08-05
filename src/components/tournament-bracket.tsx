import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TournamentState, Match, Pod, Move } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trophy, Check } from 'lucide-react';

type TournamentBracketProps = {
  tournament: TournamentState;
  currentMatchId?: string | null;
};

const getMoveEmoji = (move: Move) => {
  switch (move) {
    case 'rock': return '🪨';
    case 'paper': return '📄';
    case 'scissors': return '✂️';
    default: return '?';
  }
};

const MoveHistory = ({ moves }: { moves: Move[] }) => {
  if (!moves || moves.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1 justify-center">
      {moves.map((move, index) => (
        <span key={index} className="text-xs">{getMoveEmoji(move)}</span>
      ))}
    </div>
  );
};

const BracketPod = ({ 
  pod, 
  isWinner, 
  isLoser, 
  moveHistory 
}: { 
  pod: Pod | null, 
  isWinner?: boolean, 
  isLoser?: boolean,
  moveHistory?: Move[]
}) => {
  if (!pod) {
    return <div className="p-2 text-muted-foreground/50 text-xs">TBD</div>;
  }
  return (
    <div
      className={cn(
        'flex flex-col items-center p-2 transition-all text-center text-xs',
        isWinner && 'font-bold text-primary',
        isLoser && 'text-muted-foreground line-through opacity-70'
      )}
    >
      <div className="flex items-center gap-1">
        <span>{pod.emoji} {pod.name}</span>
        {isWinner && <Check className="w-3 h-3 text-green-500" />}
      </div>
      <MoveHistory moves={moveHistory || []} />
    </div>
  );
};

const BracketMatch = ({ match, isCurrent }: { match: Match, isCurrent?: boolean }) => {
  const pod1Moves = match.moveHistory?.map(h => h.pod1) ?? [];
  const pod2Moves = match.moveHistory?.map(h => h.pod2) ?? [];

  return (
    <div className={cn('bg-card/80 border-2 w-full', isCurrent && 'ring-2 ring-accent')}>
      <BracketPod 
        pod={match.pod1} 
        isWinner={match.winner?.id === match.pod1?.id} 
        isLoser={!!match.winner && match.winner?.id !== match.pod1?.id}
        moveHistory={pod1Moves}
      />
      {match.isBye ? (
        <div className="text-center py-1 border-t-2">
            <Badge variant="secondary" className="text-xs">BYE</Badge>
        </div>
      ) : (
        <>
            <div className="border-t-2 text-xs h-5 flex items-center justify-center text-muted-foreground">VS</div>
            <BracketPod 
              pod={match.pod2} 
              isWinner={match.winner?.id === match.pod2?.id} 
              isLoser={!!match.winner && match.winner?.id !== match.pod2?.id}
              moveHistory={pod2Moves}
            />
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
      <CardContent className="p-0 md:p-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex justify-start items-start p-4 gap-4">
            {tournament.rounds.map((round, roundIndex) => (
              <div key={round.id} className="flex flex-col items-center justify-start gap-8" style={{minWidth: 200}}>
                <h3 className="text-lg font-semibold text-center text-primary">
                  Round {roundIndex + 1}
                </h3>
                <div className="flex flex-col justify-center items-center gap-8 w-full">
                  {round.matches.map((match, matchIndex) => {
                    const isFinalMatchOfRoundPair = matchIndex % 2 === 1;
                    return (
                        <div key={match.id} className="flex items-center justify-center relative w-full">
                            <BracketMatch match={match} isCurrent={match.id === currentMatchId} />

                            {isFinalMatchOfRoundPair && tournament.rounds[roundIndex+1] && (
                                <div className="absolute left-full top-1/2 w-4 h-px bg-border -translate-y-1/2"></div>
                            )}

                             {roundIndex < tournament.rounds.length - 1 && (
                                <>
                                  <div className="absolute left-full top-1/2 w-2 h-px bg-border -translate-y-1/2"></div>
                                  <div className={cn(
                                    "absolute left-full w-px bg-border",
                                    matchIndex % 2 === 0 ? "h-full top-1/2" : "h-full bottom-1/2",
                                     (round.matches.length % 2 === 1 && matchIndex === round.matches.length - 1) && "h-0",
                                      (round.matches.length === 1) && "h-0"
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
                 <div className="flex flex-col gap-4 min-w-[200px] items-center">
                    <h3 className="text-lg font-semibold text-center text-primary">
                        Winner
                    </h3>
                    <Card className="p-4 ring-2 ring-primary bg-secondary/80 w-full max-w-[200px]">
                        <div className="flex flex-col items-center gap-2 text-center">
                           <Trophy className="w-8 h-8 text-yellow-500" />
                           <p className="text-base font-bold">{tournament.winner.name}</p>
                           <p className="text-xs text-muted-foreground">Managed by {tournament.winner.manager}</p>
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
