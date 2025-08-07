
'use client';

import type { Round, Match, Pod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';

const BracketPod = ({ pod, isWinner, isLoser }: { pod: Pod | null, isWinner: boolean, isLoser: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-2 text-base h-10",
        isWinner && "font-bold text-primary",
        isLoser && "text-muted-foreground line-through opacity-70",
        !pod && "italic text-muted-foreground"
    )}>
        {pod ? (
            <>
                <span className="text-xl">{pod.emoji}</span>
                <span className="truncate">{pod.name}</span>
            </>
        ) : "TBD"}
    </div>
);

const BracketMatch = ({ match }: { match: Match }) => {
    const hasWinner = !!match.winner;
    return (
        <Card className="w-64 bg-card/50 border-primary/20">
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

    const firstRoundMatches = rounds[0].matches;
    const midPoint = Math.ceil(firstRoundMatches.length / 2);
    const leftMatches = firstRoundMatches.slice(0, midPoint);
    const rightMatches = firstRoundMatches.slice(midPoint).reverse();

    const renderRound = (round: Round, isReversed = false) => (
        <div key={round.id} className="flex flex-col h-full">
            <h3 className="text-center font-bold text-accent uppercase tracking-widest text-lg mb-4">
                {round.name}
            </h3>
            <div className="flex flex-col gap-12 relative justify-around flex-grow">
                {(isReversed ? round.matches.slice().reverse() : round.matches).map((match, matchIndex) => (
                    <div key={match.id} className="relative">
                        <BracketMatch match={match} />
                        {/* Connecting lines */}
                        {round.id < rounds.length && (
                             <div className={cn("absolute top-1/2 h-px w-8 bg-border", isReversed ? "-left-8" : "-right-8")}></div>
                        )}
                        {round.id < rounds.length -1 && matchIndex % 2 === 0 && (
                            <div className={cn("absolute top-1/2 h-[calc(100%_+_3rem)] w-px bg-border", isReversed ? "-left-8" : "-right-8")}></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
    
    const centralRounds = rounds.slice(1);
    const quarterFinals = centralRounds.length > 0 ? centralRounds[0] : null;
    const quarterFinalsLeft = quarterFinals ? quarterFinals.matches.slice(0, quarterFinals.matches.length/2) : [];
    const quarterFinalsRight = quarterFinals ? quarterFinals.matches.slice(quarterFinals.matches.length/2) : [];


    return (
        <Card className="w-full bg-card border-2 overflow-hidden">
            <CardContent className="p-4 flex justify-center items-start">
                <div className="flex justify-between w-full">
                    {/* Left side */}
                    <div className="flex gap-8 items-start">
                         <div className="flex flex-col h-full">
                             <h3 className="text-center font-bold text-accent uppercase tracking-widest text-lg mb-4">
                                 {rounds[0].name}
                             </h3>
                             <div className="flex flex-col gap-12 relative justify-around flex-grow">
                                 {leftMatches.map((match, matchIndex) => (
                                     <div key={match.id} className="relative">
                                         <BracketMatch match={match} />
                                         <div className="absolute top-1/2 -right-8 h-px w-8 bg-border"></div>
                                         {matchIndex % 2 === 0 && (
                                            <div className="absolute top-1/2 -right-8 h-[calc(100%_+_3rem)] w-px bg-border"></div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                         {quarterFinals && renderRound({ ...quarterFinals, matches: quarterFinalsLeft })}
                    </div>

                    {/* Central rounds (Semi-final and Final) */}
                    <div className="flex gap-8 items-center pt-24">
                       {centralRounds.slice(1).map(round => renderRound(round))}
                    </div>

                    {/* Right side */}
                    <div className="flex flex-row-reverse gap-8 items-start">
                         <div className="flex flex-col h-full">
                             <h3 className="text-center font-bold text-accent uppercase tracking-widest text-lg mb-4">
                                 {rounds[0].name}
                             </h3>
                             <div className="flex flex-col gap-12 relative justify-around flex-grow">
                                 {rightMatches.map((match, matchIndex) => (
                                     <div key={match.id} className="relative">
                                         <BracketMatch match={match} />
                                          <div className="absolute top-1/2 -left-8 h-px w-8 bg-border"></div>
                                          {matchIndex % 2 === 0 && (
                                             <div className="absolute top-1/2 -left-8 h-[calc(100%_+_3rem)] w-px bg-border"></div>
                                          )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                         {quarterFinals && renderRound({ ...quarterFinals, matches: quarterFinalsRight }, true)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
