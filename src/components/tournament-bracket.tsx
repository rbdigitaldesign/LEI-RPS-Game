
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const BracketPod = ({ pod, isWinner }: { pod: Pod | null, isWinner: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-1 text-xs",
        isWinner ? "font-bold text-primary" : "text-muted-foreground",
        !pod && "italic"
    )}>
        {pod ? (
            <>
                <span className="text-sm">{pod.emoji}</span>
                <span>{pod.name}</span>
            </>
        ) : "TBD"}
    </div>
);

const BracketMatch = ({ match }: { match: Match }) => {
    return (
        <Card className="w-48 bg-card/50 border-primary/20">
            <CardContent className="p-1">
                <BracketPod pod={match.pod1} isWinner={match.winner?.id === match.pod1?.id} />
                <div className="border-t border-border/50 my-1 mx-1"></div>
                <BracketPod pod={match.pod2} isWinner={match.winner?.id === match.pod2?.id} />
            </CardContent>
        </Card>
    );
};


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    return (
        <Card className="w-full bg-card border-2">
            <CardContent className="p-4">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-8 items-center">
                        {rounds.map((round, roundIndex) => (
                            <div key={round.id} className="flex flex-col justify-around gap-4 h-full">
                                <h3 className="text-center font-bold text-accent uppercase tracking-widest">
                                    {roundIndex === rounds.length -1 ? "Final" : `Round ${round.id}`}
                                </h3>
                                <div className={cn(
                                    "flex flex-col gap-4 relative",
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

    