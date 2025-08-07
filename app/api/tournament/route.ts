
import { NextRequest, NextResponse } from 'next/server';
import { PODS } from '@/lib/constants';
import type { TournamentState, Pod, Round, Match, Move } from '@/lib/types';

// In-memory storage for demo purposes
// For Firebase production, you'd use Firestore or Realtime Database
let tournamentState: TournamentState | null = null;

// Add CORS headers for Firebase hosting
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const createBracket = (initialPods: Pod[]): TournamentState => {
  const shuffledPods = shuffleArray(initialPods);
  
  const numPods = shuffledPods.length;
  const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
  const byesCount = nextPowerOfTwo - numPods;
  const totalRounds = Math.log2(nextPowerOfTwo);
  
  let rounds: Round[] = [];
  let podsForNextRound: (Pod | null)[] = [...shuffledPods];
  
  for (let i = 0; i < totalRounds; i++) {
      const roundMatches: Match[] = [];
      const isFirstRound = i === 0;
      let matchCounter = 0;
      let byePods: Pod[] = [];
      
      if (isFirstRound && byesCount > 0) {
          byePods = podsForNextRound.slice(0, byesCount) as Pod[];
          podsForNextRound = podsForNextRound.slice(byesCount);
      }

      for (let j = 0; j < podsForNextRound.length; j += 2) {
          roundMatches.push({
              id: `r${i + 1}-m${matchCounter++}`,
              pod1: podsForNextRound[j],
              pod2: podsForNextRound[j + 1],
              winner: null,
              loser: null,
              moveHistory: [],
          });
      }
      
      if (isFirstRound) {
          byePods.forEach((pod, k) => {
              roundMatches.unshift({
                  id: `r${i + 1}-bye${k}`,
                  pod1: pod,
                  pod2: null,
                  winner: pod,
                  loser: null,
                  isBye: true,
                  moveHistory: [],
              });
          });
      }

      rounds.push({ 
        id: i + 1, 
        name: i === totalRounds - 1 ? 'Final' : 
              i === totalRounds - 2 ? 'Semi-Final' : 
              i === totalRounds - 3 ? 'Quarter-Final' : 
              `Round ${i + 1}`,
        matches: roundMatches 
      });

      podsForNextRound = new Array(roundMatches.length).fill(null);
  }

  const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

  return {
    pods: initialPods,
    rounds: rounds,
    currentMatchId: firstPlayableMatch?.id || null,
    winner: null,
  };
};

export async function GET() {
  return NextResponse.json(
    { tournament: tournamentState }, 
    { headers: corsHeaders }
  );
}

export async function POST(request: NextRequest) {
  const { action, ...data } = await request.json();

  switch (action) {
    case 'start':
      const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
      tournamentState = createBracket(initialPods);
      return NextResponse.json({ tournament: tournamentState });

    case 'reset':
      tournamentState = null;
      return NextResponse.json({ tournament: null });

    case 'playMove':
      if (!tournamentState || !data.teamName || !data.move) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
      }
      
      // Find the current match for this team
      const currentMatch = tournamentState.rounds
        .flatMap(r => r.matches)
        .find(m => 
          m.id === tournamentState?.currentMatchId && 
          !m.isBye && 
          (m.pod1?.name === data.teamName || m.pod2?.name === data.teamName)
        );

      if (!currentMatch) {
        return NextResponse.json({ error: 'No current match for this team' }, { status: 400 });
      }

      // Store the move
      if (!currentMatch.moves) {
        currentMatch.moves = {} as any;
      }

      if (currentMatch.pod1?.name === data.teamName) {
        (currentMatch.moves as any).pod1 = data.move;
      } else if (currentMatch.pod2?.name === data.teamName) {
        (currentMatch.moves as any).pod2 = data.move;
      }

      // Check if both teams have played
      if ((currentMatch.moves as any).pod1 && (currentMatch.moves as any).pod2) {
        const pod1Move = (currentMatch.moves as any).pod1;
        const pod2Move = (currentMatch.moves as any).pod2;

        // Determine winner
        let winner: Pod | null = null;
        let loser: Pod | null = null;

        if (pod1Move !== pod2Move) {
          if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
              (pod1Move === 'scissors' && pod2Move === 'paper') ||
              (pod1Move === 'paper' && pod2Move === 'rock')) {
            winner = currentMatch.pod1;
            loser = currentMatch.pod2;
          } else {
            winner = currentMatch.pod2;
            loser = currentMatch.pod1;
          }
        }

        if (!currentMatch.moveHistory) {
          currentMatch.moveHistory = [];
        }
        currentMatch.moveHistory.push({ pod1: pod1Move, pod2: pod2Move });

        if (winner) {
          currentMatch.winner = winner;
          currentMatch.loser = loser;
          
          // Advance to next round
          const currentRoundIndex = tournamentState.rounds.findIndex(r => 
            r.matches.some(m => m.id === tournamentState?.currentMatchId)
          );
          const currentMatchIndex = tournamentState.rounds[currentRoundIndex].matches.findIndex(m => 
            m.id === tournamentState?.currentMatchId
          );

          const nextRoundIndex = currentRoundIndex + 1;
          if (nextRoundIndex < tournamentState.rounds.length) {
            const nextMatchIndex = Math.floor(currentMatchIndex / 2);
            let matchInNextRound = tournamentState.rounds[nextRoundIndex].matches[nextMatchIndex];
            
            if(matchInNextRound) {
              if (currentMatchIndex % 2 === 0) {
                  matchInNextRound.pod1 = winner;
              } else {
                  matchInNextRound.pod2 = winner;
              }
            }
          }

          // Find next match
          let nextMatchId: string | null = null;
          outerLoop: for (let r = 0; r < tournamentState.rounds.length; r++) {
            for (let m = 0; m < tournamentState.rounds[r].matches.length; m++) {
              const match = tournamentState.rounds[r].matches[m];
              if (!match.isBye && !match.winner && match.pod1 && match.pod2) {
                nextMatchId = match.id;
                break outerLoop;
              }
            }
          }

          tournamentState.currentMatchId = nextMatchId;
          
          if (!nextMatchId) {
             const lastRound = tournamentState.rounds[tournamentState.rounds.length - 1];
             if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
                 tournamentState.winner = lastRound.matches[0].winner;
             }
          }
        } else {
          // Draw - reset moves and play again
          currentMatch.moves = undefined;
        }
      }

      return NextResponse.json({ tournament: tournamentState });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
