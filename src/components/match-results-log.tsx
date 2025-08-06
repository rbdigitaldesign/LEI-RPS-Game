
'use client';

import type { Match } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveIcon } from './icons/move-icon';
import { ScrollArea } from './ui/scroll-area';
import { Trophy, Handshake } from 'lucide-react';

type MatchResultsLogProps = {
  matches: Match[];
};

export function MatchResultsLog({ matches }: MatchResultsLogProps) {
  const reversedMatches = [...matches].reverse();

  return (
    <Card className="bg-card border-2">
      <CardHeader className="p-2">
        <CardTitle className="text-accent text-base text-center">Match Results</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-96">
          <div className="space-y-2 pr-4">
            {reversedMatches.map((match) => (
              <div key={match.id} className="p-2 bg-secondary border border-border/50 text-xs">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{match.pod1?.name}</span>
                    {match.moves && <MoveIcon move={match.moves.pod1} className="text-lg" />}
                  </div>
                  <span className="font-bold text-accent">VS</span>
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{match.pod2?.name}</span>
                    {match.moves && <MoveIcon move={match.moves.pod2} className="text-lg" />}
                  </div>
                </div>
                <div className="text-center mt-1 pt-1 border-t border-border/50">
                    {match.isDraw ? (
                        <div className="flex items-center justify-center gap-1 font-bold text-yellow-500">
                            <Handshake className="w-3 h-3"/>
                            <span>DRAW</span>
                        </div>
                    ) : (
                         <div className="flex items-center justify-center gap-1 font-bold text-primary">
                            <Trophy className="w-3 h-3"/>
                            <span>WINNER: {match.winner?.name}</span>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
