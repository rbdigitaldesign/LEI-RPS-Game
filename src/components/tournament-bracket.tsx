
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Pod | null, isWinner: boolean, isLoser: boolean }) => (
    <div className={cn(
        "flex items-center gap-1 p-1 text-[10px]",
        isWinner && "font-bold text-green-500",
        isLoser && "text-muted-foreground line-through opacity-70",
        !pod && "italic"
    )}>
        {pod ? (
            <>
                <span className="text-xs">{pod.emoji}</span>
                <span className="truncate">{pod.name}</span>
            </>
        ) : "TBD"}
    </div>
);

const BracketMatch = ({ match }: { match: Match }) => {
    // A match is considered "played" if it has a winner AND it was not a bye.
    const hasPlayedAndWon = !!match.winner && !match.isBye;
    return (
        <Card className="w-36 bg-card/50 border-primary/20">
            <CardContent className="p-0.5">
                <BracketPod 
                    pod={match.pod1} 
                    isWinner={hasPlayedAndWon && match.winner?.id === match.pod1?.id}
                    isLoser={hasPlayedAndWon && match.winner?.id !== match.pod1?.id}
                />
                <div className="border-t border-border/50 my-0.5 mx-1"></div>
                <BracketPod 
                    pod={match.pod2} 
                    isWinner={hasPlayedAndWon && match.winner?.id === match.pod2?.id}
                    isLoser={hasPlayedAndWon && match.winner?.id !== match.pod2?.id}
                />
            </CardContent>
        </Card>
    );
};


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-2">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4 items-center">
                        {rounds.map((round, roundIndex) => (
                            <div key={round.id} className="flex flex-col justify-around gap-2 h-full">
                                <h3 className="text-center font-bold text-accent uppercase tracking-widest text-xs">
                                    {roundIndex === rounds.length -1 ? "Final" : `R${round.id}`}
                                </h3>
                                <div className={cn(
                                    "flex flex-col gap-2 relative",
                                     roundIndex > 0 && "justify-around flex-grow"
                                )}>
                                    {round.matches.map(match => (
                                        <BracketMatch key={match.id} match={match} />
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
