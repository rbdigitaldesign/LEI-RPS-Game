
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Pod | null, isWinner: boolean, isLoser: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-1 text-[10px] h-6",
        isWinner && "font-bold text-primary",
        isLoser && "text-muted-foreground line-through opacity-70",
        !pod && "italic text-muted-foreground"
    )}>
        {pod ? (
            <>
                <span className="text-sm">{pod.emoji}</span>
                <span className="truncate">{pod.name}</span>
            </>
        ) : "TBD"}
    </div>
);

const BracketMatch = ({ match }: { match: Match }) => {
    const hasWinner = !!match.winner;
    return (
        <Card className="w-40 bg-card/50 border-primary/20">
            <CardContent className="p-0">
                <BracketPod 
                    pod={match.pod1} 
                    isWinner={hasWinner && match.winner?.id === match.pod1?.id}
                    isLoser={hasWinner && match.winner?.id !== match.pod1?.id}
                />
                <div className="border-t border-border/50"></div>
                <BracketPod 
                    pod={match.pod2} 
                    isWinner={hasWinner && match.winner?.id === match.pod2?.id}
                    isLoser={hasWinner && match.winner?.id !== match.pod2?.id}
                />
            </CardContent>
        </Card>
    );
};


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-4">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-8 items-stretch">
                        {rounds.map((round) => (
                            <div key={round.id} className="flex flex-col h-full">
                                <h3 className="text-center font-bold text-accent uppercase tracking-widest text-sm mb-4">
                                    {round.name}
                                </h3>
                                <div className="flex flex-col gap-6 relative justify-around flex-grow">
                                    {round.matches.map(match => (
                                        <BracketMatch key={match.id} match={match} />
                                    ))}
                                    {/* Spacer for the lucky pod that gets a pass in round 2 */}
                                    {round.id === 2 && (
                                      <div className="w-40 p-0 text-center">
                                        <div className="text-[10px] text-muted-foreground italic h-12 flex items-center justify-center">
                                          (Winner awaiting)
                                        </div>
                                      </div>
                                    )}
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
