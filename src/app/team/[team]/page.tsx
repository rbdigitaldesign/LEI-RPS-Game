
'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { useServerTournament } from '@/hooks/use-server-tournament';
import type { Move, Match, Pod } from '@/lib/types';
import { Trophy, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CommentaryBox } from '@/components/commentary-box';

export default function TeamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawTeamName = (params?.team as string) || searchParams?.get('team');
  
  const teamName = rawTeamName ? decodeURIComponent(rawTeamName) : null;
  
  const { tournament, refetch } = useServerTournament();
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedMove, setHasSubmittedMove] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamPod, setTeamPod] = useState<Pod | null>(null);
  const [opponentPod, setOpponentPod] = useState<Pod | null>(null);
  const [lastMoveHistory, setLastMoveHistory] = useState<any[]>([]);
  const [lastMatchWinner, setLastMatchWinner] = useState<Pod | null>(null);
  const [isEliminated, setIsEliminated] = useState<boolean>(false);
  const { toast } = useToast();

  const submitMove = async () => {
    if (!selectedMove || !teamName) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'playMove',
          teamName,
          move: selectedMove
        })
      });

      if (response.ok) {
        setHasSubmittedMove(true);
        setSelectedMove(null);
        await refetch();
      }
    } catch (error) {
      console.error('Failed to submit move:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (tournament && teamName) {
      const pod = tournament.pods.find(p => p.name === teamName);
      setTeamPod(pod || null);

      if (pod) {
        const match = tournament.rounds
          .flatMap(r => r.matches)
          .find(m => 
            m.id === tournament.currentMatchId && 
            !(m as any).isBye && 
            (m.pod1?.name === teamName || m.pod2?.name === teamName)
          );

        setCurrentMatch(match || null);

        if (match) {
          const opponent = match.pod1?.name === teamName ? match.pod2 : match.pod1;
          setOpponentPod(opponent);

          const teamIsPod1 = match.pod1?.name === teamName;
          const teamMove = teamIsPod1 ? match.moves?.pod1 : match.moves?.pod2;
          setHasSubmittedMove(!!teamMove);

          if (match.moveHistory && match.moveHistory.length > lastMoveHistory.length) {
            const latestRound = match.moveHistory[match.moveHistory.length - 1];
            if (latestRound.pod1 === latestRound.pod2) {
              toast({
                title: "It's a Tie! 🤝",
                description: `Both teams chose ${latestRound.pod1}. Choose again!`,
                duration: 4000,
              });
            }
            setLastMoveHistory([...match.moveHistory]);
          }

          if (match.winner && match.winner !== lastMatchWinner) {
            const isWinner = match.winner.name === teamName;
            
            if (isWinner) {
              toast({
                title: "Victory! 🎉",
                description: `You defeated ${opponent?.name}! Moving to the next round.`,
                duration: 5000,
              });
            } else {
              toast({
                title: "Match Complete",
                description: `${match.winner.name} won the match. Better luck next time!`,
                duration: 5000,
              });
            }
            setLastMatchWinner(match.winner);
          }
        } else {
          setOpponentPod(null);
          setHasSubmittedMove(false);
        }

        const isTeamEliminated = tournament.rounds
            .flatMap(r => r.matches)
            .some(m => m.loser?.name === teamName);
        
        setIsEliminated(isTeamEliminated);
      }
    }
  }, [tournament, teamName, lastMoveHistory.length, toast, lastMatchWinner]);

  if (!teamName) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-red-500 font-headline">Invalid Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No team specified. Please use a valid team URL.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className='font-headline'>Loading Tournament...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!teamPod) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive font-headline">Team Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Team "{teamName}" is not part of this tournament.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (tournament.winner) {
    const isWinner = tournament.winner.name === teamName;
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className={`w-full max-w-lg text-center ${isWinner ? 'border-4 border-accent' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl">{teamPod.emoji}</span>
                <div>
                  <CardTitle className="text-2xl font-headline">{teamPod.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Represented by {teamPod.manager}</p>
                </div>
              </div>
              {isWinner ? (
                <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-primary font-headline">
                  <Trophy className="w-8 h-8"/>
                  <span>Tournament Champion!</span>
                </div>
              ) : (
                <div className="text-lg font-medium text-muted-foreground font-headline">
                  Tournament Complete
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isWinner ? (
                <div className="space-y-4">
                  <div className="text-6xl">{teamPod.emoji}</div>
                  <p className="text-lg font-medium">Congratulations! You've won the tournament!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500"/>
                    <span className="font-medium">Winner: {tournament.winner.name}</span>
                    <span className="text-2xl">{tournament.winner.emoji}</span>
                  </div>
                  <p>Better luck next time!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (isEliminated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center border-2 border-destructive">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl grayscale">{teamPod.emoji}</span>
                <div>
                  <CardTitle className="text-2xl text-muted-foreground font-headline">{teamPod.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Represented by {teamPod.manager}</p>
                </div>
              </div>
              <div className="text-lg font-medium text-destructive font-headline">
                Eliminated from Tournament
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-6xl grayscale">{teamPod.emoji}</div>
              <div className="text-lg text-destructive font-semibold">❌ ELIMINATED</div>
              <p className="text-sm text-muted-foreground">
                Your team has been eliminated. Thank you for participating!
              </p>
              <p className="text-lg font-semibold text-primary">Please close this tab and return to the main screen share.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl">{teamPod.emoji}</span>
                <div>
                  <CardTitle className="text-2xl font-headline">{teamPod.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Represented by {teamPod.manager}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground"/>
                <span>Waiting for your next match...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The tournament is in progress. You'll be notified when it's your turn to play.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const bothMovesSubmitted = currentMatch.moves?.pod1 && currentMatch.moves?.pod2;
  const opponentIsAI = opponentPod?.name === 'Cox Travis';
  const currentRound = tournament.rounds.find(r => 
    r.matches.some(m => m.id === tournament.currentMatchId)
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline">{currentRound?.name}</Badge>
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Rock Paper Scissors Battle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-center space-y-2">
                <div className="text-6xl">{teamPod.emoji}</div>
                <div>
                  <div className="font-bold text-lg">{teamPod.name}</div>
                  <div className="text-sm text-muted-foreground">{teamPod.manager}</div>
                </div>
                {hasSubmittedMove && (
                  <Badge variant="secondary">Move Submitted</Badge>
                )}
              </div>

              <div className="text-4xl font-bold text-muted-foreground font-headline">VS</div>

              <div className="text-center space-y-2">
                <div className="text-6xl">{opponentPod?.emoji}</div>
                <div>
                  <div className="font-bold text-lg">{opponentPod?.name}</div>
                  <div className="text-sm text-muted-foreground">{opponentPod?.manager}</div>
                </div>
                {bothMovesSubmitted && !opponentIsAI && (
                  <Badge variant="secondary">Move Submitted</Badge>
                )}
                {opponentIsAI && (
                  <Badge variant="destructive">AI Player</Badge>
                )}
              </div>
            </div>

            {bothMovesSubmitted && (
              <div className="text-center space-y-4 p-4 bg-muted rounded-lg">
                <h3 className="text-xl font-bold font-headline">Round Result</h3>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {currentMatch.moves?.pod1 === 'rock' ? '🪨' :
                       currentMatch.moves?.pod1 === 'paper' ? '📄' : '✂️'}
                    </div>
                    <div className="font-medium">{currentMatch.pod1?.name}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {currentMatch.moves?.pod2 === 'rock' ? '🪨' :
                       currentMatch.moves?.pod2 === 'paper' ? '📄' : '✂️'}
                    </div>
                    <div className="font-medium">{currentMatch.pod2?.name}</div>
                  </div>
                </div>
                {currentMatch.winner ? (
                  <div className="text-lg font-bold text-primary">
                    Winner: {currentMatch.winner.name} {currentMatch.winner.emoji}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-500">
                      <AlertTriangle className="w-5 h-5" />
                      <span className='font-headline'>It's a Tie!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Both teams chose the same move. Choose again!</p>
                  </div>
                )}
                
                {currentMatch.moveHistory && currentMatch.moveHistory.length > 1 && (
                  <div className="mt-4 p-3 bg-background rounded border">
                    <h4 className="font-medium mb-2 font-headline">Previous Rounds:</h4>
                    <div className="space-y-1">
                      {currentMatch.moveHistory.slice(0, -1).map((round, index) => (
                        <div key={index} className="flex items-center justify-center gap-4 text-sm">
                          <span>Round {index + 1}:</span>
                          <span>{round.pod1 === 'rock' ? '🪨' : round.pod1 === 'paper' ? '📄' : '✂️'}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span>{round.pod2 === 'rock' ? '🪨' : round.pod2 === 'paper' ? '📄' : '✂️'}</span>
                          <span className="text-yellow-500 font-medium font-headline">{round.pod1 === round.pod2 ? 'TIE' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasSubmittedMove && !bothMovesSubmitted && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center font-headline">Choose Your Move</h3>
                <div className="grid grid-cols-3 gap-4">
                  {(['rock', 'paper', 'scissors'] as Move[]).map((move) => (
                    <Button
                      key={move}
                      variant={selectedMove === move ? 'default' : 'outline'}
                      size="lg"
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setSelectedMove(move)}
                    >
                      <span className="text-3xl">
                        {move === 'rock' ? '🪨' : move === 'paper' ? '📄' : '✂️'}
                      </span>
                      <span className="capitalize">{move}</span>
                    </Button>
                  ))}
                </div>
                {selectedMove && (
                  <Button 
                    onClick={submitMove}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${selectedMove.charAt(0).toUpperCase() + selectedMove.slice(1)}`}
                  </Button>
                )}
              </div>
            )}

            {hasSubmittedMove && !bothMovesSubmitted && !opponentIsAI && (
              <div className="text-center space-y-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 animate-pulse"/>
                  <span className="font-medium">Waiting for opponent...</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You've submitted your move. Waiting for {opponentPod?.name} to play.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <CommentaryBox show={!!currentMatch} />
    </div>
  );

    
