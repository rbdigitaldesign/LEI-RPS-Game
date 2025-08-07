
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
  'Access-control-allow-headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const createBracket = (initialPods: Pod[]): TournamentState => {
  let shuffledPods = shuffleArray(initialPods);
  const numPods = shuffledPods.length;
  
  // Handle odd number of teams by adding the AI opponent
  if (numPods % 2 !== 0) {
      const aiPod: Pod = {
          id: 99,
          name: 'Cox Travis',
          manager: 'The AI',
          emoji: '🤖',
      };
      shuffledPods.push(aiPod);
  }

  const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(shuffledPods.length));
  const totalRounds = Math.log2(nextPowerOfTwo);
  
  let rounds: Round[] = [];
  let currentPods: (Pod | null)[] = [...shuffledPods];

  // Pad with nulls if not a power of two
  while (currentPods.length < nextPowerOfTwo) {
    currentPods.push(null);
  }
  
  // Create Round 1
  const round1Matches: Match[] = [];
  for (let i = 0; i < currentPods.length; i += 2) {
    round1Matches.push({
      id: `r1-m${i/2}`,
      pod1: currentPods[i],
      pod2: currentPods[i+1],
      winner: null,
      loser: null,
      isBye: !currentPods[i] || !currentPods[i+1],
      moveHistory: [],
    });
  }
  
  // Auto-resolve bye matches
  round1Matches.forEach(match => {
      if (match.isBye) {
          match.winner = match.pod1 || match.pod2;
      }
  });

  rounds.push({ id: 1, name: 'Round 1', matches: round1Matches });
  
  // Create subsequent rounds
  for (let i = 1; i < totalRounds; i++) {
    const previousRoundMatches = rounds[i - 1].matches;
    const nextRoundMatches: Match[] = [];
    
    // Get winners from the previous round
    const winners = previousRoundMatches.map(m => m.winner);
    
    for (let j = 0; j < winners.length; j += 2) {
      nextRoundMatches.push({
        id: `r${i + 1}-m${j/2}`,
        pod1: winners[j],
        pod2: winners[j+1],
        winner: null,
        loser: null,
        moveHistory: [],
      });
    }
    
    let roundName = `Round ${i + 1}`;
    if (i === totalRounds - 1) roundName = 'Final';
    else if (i === totalRounds - 2) roundName = 'Semi-Final';
    else if (i === totalRounds - 3) roundName = 'Quarter-Final';

    rounds.push({ id: i + 1, name: roundName, matches: nextRoundMatches });
  }

  const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

  return {
    pods: initialPods,
    rounds: rounds,
    currentMatchId: firstPlayableMatch?.id || null,
    winner: null,
  };
};

const resolveMatch = (currentMatch: Match, pod1Move: Move, pod2Move: Move) => {
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
    currentMatch.moves = { pod1: pod1Move, pod2: pod2Move };

    if (winner) {
      currentMatch.winner = winner;
      currentMatch.loser = loser;
    } else {
      // Tie, reset moves for this match
      currentMatch.moves = undefined;
    }
};

const advanceTournament = (state: TournamentState) => {
    const lastMatchId = state.currentMatchId;
    if(!lastMatchId) return;

    const currentRoundIndex = state.rounds.findIndex(r => r.matches.some(m => m.id === lastMatchId));
    const currentMatchIndex = state.rounds[currentRoundIndex].matches.findIndex(m => m.id === lastMatchId);
    const winner = state.rounds[currentRoundIndex].matches[currentMatchIndex].winner;

    const nextRoundIndex = currentRoundIndex + 1;
    if (winner && nextRoundIndex < state.rounds.length) {
        const nextMatchIndex = Math.floor(currentMatchIndex / 2);
        const matchInNextRound = state.rounds[nextRoundIndex].matches[nextMatchIndex];

        if (matchInNextRound) {
            if (currentMatchIndex % 2 === 0) {
                matchInNextRound.pod1 = winner;
            } else {
                matchInNextRound.pod2 = winner;
            }
        }
    }

    let nextMatchId: string | null = null;
    outerLoop: for (let r = 0; r < state.rounds.length; r++) {
        for (let m = 0; m < state.rounds[r].matches.length; m++) {
            const match = state.rounds[r].matches[m];
            if (!match.isBye && !match.winner && match.pod1 && match.pod2) {
                nextMatchId = match.id;
                break outerLoop;
            }
        }
    }

    state.currentMatchId = nextMatchId;

    if (!nextMatchId) {
        const lastRound = state.rounds[state.rounds.length - 1];
        if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            state.winner = lastRound.matches[0].winner;
        }
    }
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

      if (!currentMatch.moves) {
        currentMatch.moves = {} as any;
      }
      
      const moves: Move[] = ['rock', 'paper', 'scissors'];
      const isAIBotMatch = currentMatch.pod1?.name === 'Cox Travis' || currentMatch.pod2?.name === 'Cox Travis';
      
      // Assign human move
      if (currentMatch.pod1?.name === data.teamName) {
        (currentMatch.moves as any).pod1 = data.move;
      } else if (currentMatch.pod2?.name === data.teamName) {
        (currentMatch.moves as any).pod2 = data.move;
      }

      // If it's a bot match, assign bot move
      if (isAIBotMatch) {
          const aiMove = moves[Math.floor(Math.random() * moves.length)];
          if(currentMatch.pod1?.name === 'Cox Travis') {
              (currentMatch.moves as any).pod1 = aiMove;
          } else {
              (currentMatch.moves as any).pod2 = aiMove;
          }
      }

      if ((currentMatch.moves as any).pod1 && (currentMatch.moves as any).pod2) {
        const pod1Move = (currentMatch.moves as any).pod1;
        const pod2Move = (currentMatch.moves as any).pod2;
        
        resolveMatch(currentMatch, pod1Move, pod2Move);
        
        if (currentMatch.winner) {
            advanceTournament(tournamentState);
        }
      }

      return NextResponse.json({ tournament: tournamentState });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
