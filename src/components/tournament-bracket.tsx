
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Pod | null, isWinner: boolean, isLoser: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-2 text-sm h-10",
        isWinner && "font-bold text-primary",
        isLoser && "text-muted-foreground line-through opacity-70",
        !pod && "italic text-muted-foreground text-xs"
    )}>
        {pod ? (
            <>
                <span className="text-lg">{pod.emoji}</span>
                <span className="truncate">{pod.name}</span>
            </>
        ) : "TBD"}
    </div>
);

const BracketMatch = ({ match, roundId, rounds }: { match: Match, roundId: number, rounds: Round[] }) => {
    const isFinalRound = roundId === rounds.length;
    
    if (match.isBye && match.winner) {
        return (
             <div className="relative">
                <Card className="w-64 bg-card border-2 border-dashed">
                    <CardContent className="p-0">
                        <BracketPod 
                            pod={match.winner} 
                            isWinner={true}
                            isLoser={false}
                        />
                         <div className="h-10 flex items-center justify-center text-xs text-muted-foreground italic">
                            (Bye)
                        </div>
                    </CardContent>
                </Card>
                {!isFinalRound && (
                    <>
                        {/* Horizontal line out of the match */}
                        <div className="absolute top-1/2 -right-8 h-px w-8 bg-border"></div>
                    </>
                )}
             </div>
        )
    }

    const hasWinner = !!match.winner;

    return (
        <div className="relative">
            <Card className="w-64 bg-card/80 border-primary/20">
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
            {!isFinalRound && (
                 <>
                    {/* Horizontal line out of the match */}
                    <div className="absolute top-1/2 -right-8 h-px w-8 bg-border"></div>
                </>
            )}
        </div>
    );
};


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-4">
                 <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-16 items-center py-4">
                        {rounds.map((round, roundIndex) => (
                            <div key={round.id} className="flex flex-col justify-center h-full">
                                <h3 className="text-center font-bold text-accent uppercase tracking-widest text-sm mb-4 h-5">
                                    {round.name}
                                </h3>
                                <div className="flex flex-col gap-12 justify-around flex-grow relative">
                                    {round.matches.map((match, matchIndex) => (
                                        <div key={match.id} className="relative z-10">
                                            <BracketMatch match={match} roundId={round.id} rounds={rounds} />

                                            {/* Vertical connector line for every pair of matches */}
                                            {matchIndex % 2 === 0 && roundIndex < rounds.length -1 && (
                                                <div 
                                                    className="absolute w-px bg-border"
                                                    style={{
                                                        height: `calc(100% + 3rem)`, // 100% of parent + gap
                                                        right: '-2rem', // in the middle of the horizontal lines
                                                        top: '50%',
                                                    }}
                                                />
                                            )}
                                        </div>
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
