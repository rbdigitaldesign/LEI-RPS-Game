
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
  let allPods = [...initialPods];
  
  // Always add the AI opponent to make it an even 16
  const aiPod: Pod = {
      id: 99,
      name: 'Cox Travis',
      manager: 'The AI',
      emoji: '🤖',
  };
  allPods.push(aiPod);
  
  let shuffledPods = shuffleArray(allPods);
  
  const numPods = shuffledPods.length;
  const totalRounds = Math.log2(numPods);
  
  let rounds: Round[] = [];
  let currentPods: (Pod | null)[] = [...shuffledPods];
  
  // Create Round 1
  const round1Matches: Match[] = [];
  for (let i = 0; i < currentPods.length; i += 2) {
    round1Matches.push({
      id: `r1-m${i/2}`,
      pod1: currentPods[i],
      pod2: currentPods[i+1],
      winner: null,
      loser: null,
      moveHistory: [],
    });
  }
  
  rounds.push({ id: 1, name: 'Round 1', matches: round1Matches });
  
  // Create subsequent rounds
  for (let i = 1; i < totalRounds; i++) {
    const previousRoundMatches = rounds[i - 1].matches;
    const nextRoundMatches: Match[] = [];
    
    // Create placeholders for the next round
    for (let j = 0; j < previousRoundMatches.length / 2; j++) {
      nextRoundMatches.push({
        id: `r${i + 1}-m${j}`,
        pod1: null,
        pod2: null,
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

  const firstPlayableMatch = rounds[0].matches.find(m => m.pod1 && m.pod2);

  return {
    pods: initialPods, // Return original human pods
    rounds: rounds,
    currentMatchId: firstPlayableMatch?.id || null,
    winner: null,
  };
};

const resolveMatch = (currentMatch: Match, pod1Move: Move, pod2Move: Move) => {
    let winner: Pod | null = null;
    let loser: Pod | null = null;

    const isPod1FriendlyAI = currentMatch.pod1?.name === 'Cox Travis';
    const isPod2FriendlyAI = currentMatch.pod2?.name === 'Cox Travis';
    const isPod1LoserAI = currentMatch.pod1?.name === 'Skynet';
    const isPod2LoserAI = currentMatch.pod2?.name === 'Skynet';

    const isAIVsAI = (isPod1FriendlyAI && isPod2LoserAI) || (isPod1LoserAI && isPod2FriendlyAI);

    if (pod1Move !== pod2Move) {
      if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
          (pod1Move === 'scissors' && pod2Move === 'paper') ||
          (pod1Move === 'paper' && pod2Move === 'rock')) {
        // Pod 1 would win
        if (isPod1FriendlyAI && !isAIVsAI) { // Friendly AI would win vs human, force draw
            winner = null;
            loser = null;
        } else if (isPod1LoserAI && !isAIVs_AI) { // Loser AI would win vs human, force loss for AI
            winner = currentMatch.pod2;
            loser = currentMatch.pod1;
        } else {
            winner = currentMatch.pod1;
            loser = currentMatch.pod2;
        }
      } else {
        // Pod 2 would win
        if (isPod2FriendlyAI && !isAIVsAI) { // Friendly AI would win vs human, force draw
            winner = null;
            loser = null;
        } else if (isPod2LoserAI && !isAIVsAI) { // Loser AI would win vs human, force loss for AI
            winner = currentMatch.pod1;
            loser = currentMatch.pod2;
        } else {
            winner = currentMatch.pod2;
            loser = currentMatch.pod1;
        }
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

    let currentRoundIndex = -1, currentMatchIndex = -1;
    for(let i=0; i<state.rounds.length; i++){
        const matchIdx = state.rounds[i].matches.findIndex(m => m.id === lastMatchId);
        if(matchIdx !== -1) {
            currentRoundIndex = i;
            currentMatchIndex = matchIdx;
            break;
        }
    }
    
    if(currentRoundIndex === -1) return;

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
            if (!match.winner && match.pod1 && match.pod2) {
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
          (m.pod1?.name === data.teamName || m.pod2?.name === data.teamName)
        );

      if (!currentMatch) {
        return NextResponse.json({ error: 'No current match for this team' }, { status: 400 });
      }

      if (!currentMatch.moves) {
        currentMatch.moves = {} as any;
      }
      
      const moves: Move[] = ['rock', 'paper', 'scissors'];
      const isAIBotInMatch = currentMatch.pod1?.name === 'Cox Travis' || currentMatch.pod2?.name === 'Cox Travis' || currentMatch.pod1?.name === 'Skynet' || currentMatch.pod2?.name === 'Skynet';
      
      // Assign human move
      if (currentMatch.pod1?.name === data.teamName) {
        (currentMatch.moves as any).pod1 = data.move;
      } else if (currentMatch.pod2?.name === data.teamName) {
        (currentMatch.moves as any).pod2 = data.move;
      }

      // If it's a bot match, assign bot move for any bot not played by a human
      if (isAIBotInMatch) {
          const aiMove = moves[Math.floor(Math.random() * moves.length)];
          if(currentMatch.pod1?.name === 'Cox Travis' && !(currentMatch.moves as any).pod1) {
              (currentMatch.moves as any).pod1 = aiMove;
          } else if(currentMatch.pod2?.name === 'Cox Travis' && !(currentMatch.moves as any).pod2) {
              (currentMatch.moves as any).pod2 = aiMove;
          }
          if(currentMatch.pod1?.name === 'Skynet' && !(currentMatch.moves as any).pod1) {
              (currentMatch.moves as any).pod1 = aiMove;
          } else if(currentMatch.pod2?.name === 'Skynet' && !(currentMatch.moves as any).pod2) {
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
