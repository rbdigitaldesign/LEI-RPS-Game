
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

const BracketMatch = ({ match }: { match: Match }) => {
    if (match.isBye && match.winner) {
        return (
             <Card className="w-52 bg-card border-2 border-dashed">
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
        )
    }

    const hasWinner = !!match.winner;

    return (
        <Card className="w-52 bg-card/80 border-primary/20">
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


const RoundColumn = ({ round, roundIndex, totalRounds, isRightSide = false }: { round: Round, roundIndex: number, totalRounds: number, isRightSide?: boolean }) => {
    const isFinalRound = roundIndex === totalRounds - 1;

    return (
        <div className="flex flex-col justify-center h-full space-y-12">
            {!isFinalRound && (
                <h3 className="text-center font-bold text-accent uppercase tracking-widest text-sm mb-4 h-5">
                    {round.name}
                </h3>
            )}
            <div className={cn(
                "flex flex-col justify-around flex-grow gap-20", 
                 roundIndex > 0 && "py-12"
            )}>
                {round.matches.map((match) => (
                    <div key={match.id} className="relative">
                        <BracketMatch match={match} />
                        {!isFinalRound && (
                             <div 
                                className={cn("absolute top-1/2 w-6 border-t-2 border-border", isRightSide ? "-left-6" : "right-0")}
                            />
                        )}
                       
                        {roundIndex < totalRounds - 2 && (
                             <div 
                                className={cn("absolute h-full w-px top-0 bg-border", isRightSide ? "left-[-1.5rem]" : "right-[-1.5rem]")}
                                style={{ height: `calc(100% + ${5 + (roundIndex * 2)}rem)`}}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


export function TournamentBracket({ rounds }: { rounds: Round[] }) {
    if (!rounds || rounds.length === 0) return null;

    const totalRounds = rounds.length;
    const finalRoundIndex = totalRounds - 1;
    const finalRound = rounds[finalRoundIndex];

    const leftBracketRounds: Round[] = [];
    const rightBracketRounds: Round[] = [];

    // Split all rounds before the final
    for(let i=0; i < finalRoundIndex; i++) {
        const round = rounds[i];
        const midPoint = Math.ceil(round.matches.length / 2);
        
        leftBracketRounds.push({ ...round, matches: round.matches.slice(0, midPoint) });
        rightBracketRounds.push({ ...round, matches: round.matches.slice(midPoint) });
    }

    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-4">
                 <ScrollArea className="w-full whitespace-nowrap" >
                    <div className="flex justify-between items-center p-8 min-h-[700px]">
                        
                        {/* Left Bracket */}
                        <div className="flex gap-16 items-center">
                            {leftBracketRounds.map((round, index) => (
                                <RoundColumn key={`left-${round.id}`} round={round} roundIndex={index} totalRounds={totalRounds}/>
                            ))}
                        </div>

                        {/* Final */}
                         <div className="flex flex-col justify-center items-center h-full">
                             <h3 className="text-center font-bold text-accent uppercase tracking-widest text-lg mb-4 h-5">
                                 {finalRound.name}
                             </h3>
                             <div className="flex flex-col justify-around flex-grow">
                                {finalRound.matches.map((match) => (
                                    <div key={match.id} className="relative">
                                        <BracketMatch match={match} />
                                         <div className="absolute top-1/2 -left-6 w-6 border-t-2 border-border"></div>
                                         <div className="absolute top-1/2 -right-6 w-6 border-t-2 border-border"></div>
                                    </div>
                                ))}
                            </div>
                         </div>
                        
                        {/* Right Bracket */}
                        <div className="flex flex-row-reverse gap-16 items-center">
                            {rightBracketRounds.map((round, index) => (
                                <RoundColumn key={`right-${round.id}`} round={round} roundIndex={index} totalRounds={totalRounds} isRightSide/>
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
