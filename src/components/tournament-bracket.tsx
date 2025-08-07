
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Pod | null, isWinner: boolean, isLoser: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-1 text-sm h-8",
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

const BracketMatch = ({ match }: { match: Match }) => {
    if (match.isBye) {
        return (
             <Card className="w-48 bg-transparent border-none">
                <CardContent className="p-0">
                    <BracketPod 
                        pod={match.pod1} 
                        isWinner={true}
                        isLoser={false}
                    />
                </CardContent>
            </Card>
        )
    }
    const hasWinner = !!match.winner;
    return (
        <Card className="w-48 bg-card/50 border-primary/20">
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

const RoundColumn = ({ round, isReversed = false }: { round: Round, isReversed?: boolean }) => (
    <div className="flex flex-col justify-around">
        <h3 className="text-center font-bold text-accent uppercase tracking-widest text-sm mb-4 h-5">
            {round.name}
        </h3>
        <div className="flex flex-col justify-around gap-10 flex-grow">
            {round.matches.map((match, index) => (
                <div key={match.id} className="relative">
                    <BracketMatch match={match} />
                    <div className={cn("absolute top-1/2 h-px w-6 bg-border", isReversed ? "-left-6" : "-right-6")}></div>
                    { index % 2 === 0 && (
                        <div className={cn("absolute top-1/2 h-[calc(100%_+_2.5rem)] w-px bg-border", isReversed ? "left-[-1.5rem]" : "right-[-1.5rem]")}></div>
                    )}
                </div>
            ))}
        </div>
    </div>
);


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    const numRounds = rounds.length;
    const finalRound = rounds[numRounds - 1];
    
    const leftBracketRounds: Round[] = [];
    const rightBracketRounds: Round[] = [];

    rounds.slice(0, -1).forEach(round => {
        const midPoint = Math.ceil(round.matches.length / 2);
        leftBracketRounds.push({ ...round, matches: round.matches.slice(0, midPoint) });
        rightBracketRounds.push({ ...round, matches: round.matches.slice(midPoint) });
    });

    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-4">
                 <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex justify-between items-center p-4 min-h-[600px]">
                        {/* Left Bracket */}
                        <div className="flex gap-12 items-stretch">
                            {leftBracketRounds.map((round) => (
                                <RoundColumn key={`left-${round.id}`} round={round} />
                            ))}
                        </div>

                        {/* Final */}
                         <div className="flex flex-col justify-around">
                             <h3 className="text-center font-bold text-accent uppercase tracking-widest text-sm mb-4 h-5">
                                 {finalRound.name}
                             </h3>
                             <div className="flex flex-col justify-around gap-10 flex-grow">
                                {finalRound.matches.map((match) => (
                                    <BracketMatch key={match.id} match={match} />
                                ))}
                            </div>
                         </div>
                        
                        {/* Right Bracket */}
                        <div className="flex flex-row-reverse gap-12 items-stretch">
                            {rightBracketRounds.map((round) => (
                                <RoundColumn key={`right-${round.id}`} round={round} isReversed />
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
