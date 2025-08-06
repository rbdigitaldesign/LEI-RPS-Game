
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES, FINAL_BOSS } from '@/lib/constants';
import type { TournamentState, Pod, Round, Match, Move } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'rps-pod-showdown-tournament';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export function useTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const saveState = (state: TournamentState | null) => {
    try {
      if (state) {
        const stateString = JSON.stringify(state);
        localStorage.setItem(LOCAL_STORAGE_KEY, stateString);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  };

  const advanceWinner = (match: Match, roundIndex: number, rounds: Round[]) => {
      if (roundIndex + 1 < rounds.length && match.winner) {
          const currentMatchIndex = rounds[roundIndex].matches.findIndex(m => m.id === match.id);
          const nextRoundIndex = roundIndex + 1;
          const nextMatchIndex = Math.floor(currentMatchIndex / 2);
          const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];

          if (currentMatchIndex % 2 === 0) {
              nextMatch.pod1 = match.winner;
          } else {
              nextMatch.pod2 = match.winner;
          }
      }
  }

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    const numPods = shuffledPods.length;
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byesCount = nextPowerOfTwo - numPods;
    const totalRounds = Math.log2(nextPowerOfTwo);

    let rounds: Round[] = [];
    
    // Initialize all rounds and matches
    for(let i=0; i < totalRounds; i++) {
        const numMatchesInRound = (2 ** (totalRounds - (i + 1)));
        rounds.push({
            id: i + 1,
            matches: Array.from({ length: numMatchesInRound }, (_, k) => ({
                id: `r${i + 1}-m${k}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                moveHistory: [],
            }))
        });
    }

    let podsForRound2 = [];
    // Handle byes
    for(let i=0; i < byesCount; i++) {
        podsForRound2.push(shuffledPods[i]);
    }
    
    // Handle first round matches
    let podsForRound1 = shuffledPods.slice(byesCount);
    let r1MatchIndex = 0;
    for(let i=0; i < podsForRound1.length; i+=2) {
        rounds[0].matches[r1MatchIndex].pod1 = podsForRound1[i];
        rounds[0].matches[r1MatchIndex].pod2 = podsForRound1[i+1];
        r1MatchIndex++;
    }
    
    // Fill in winners for byes, advancing them to round 2
    for(let i=0; i < byesCount; i++) {
        const byeMatch = {
            id: `r1-bye${i}`,
            pod1: shuffledPods[i],
            pod2: null,
            winner: shuffledPods[i],
            loser: null,
            isBye: true,
            moveHistory: [],
        }
        rounds[0].matches[r1MatchIndex] = byeMatch;
        r1MatchIndex++;
    }

    rounds[0].matches.sort((a,b) => a.id.localeCompare(b.id));

    // Prepare Round 2
    const r1Winners = rounds[0].matches.map(m => m.winner).filter(Boolean);
    const r1NonByeMatches = rounds[0].matches.filter(m => !m.isBye);

    let r2PodIndex = 0;
    for(let i = 0; i < r1NonByeMatches.length; i++) {
        const match = r1NonByeMatches[i];
        if (i % 2 === 0) {
            rounds[1].matches[r2PodIndex].pod1 = match.winner;
        } else {
            rounds[1].matches[r2PodIndex].pod2 = match.winner;
            r2PodIndex++;
        }
    }

    const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

    return {
      pods: initialPods,
      rounds: rounds,
      currentMatchId: firstPlayableMatch?.id || null,
      winner: null,
      finalMatch: null,
      gameWinner: null,
    };
  };

  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    setIsProcessing(false);
  }, []);
  
  const advanceTournament = (currentState: TournamentState) => {
    let nextMatchId: string | null = null;
    
    // Find the next playable match
    for (const round of currentState.rounds) {
        for (const match of round.matches) {
            if (!match.winner && match.pod1 && match.pod2) {
                nextMatchId = match.id;
                break;
            }
        }
        if (nextMatchId) break;
    }

    const newState = { ...currentState, currentMatchId: nextMatchId };

    if (!nextMatchId) {
        // No more playable matches, check for a tournament winner
        const lastRound = currentState.rounds[currentState.rounds.length - 1];
        if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            newState.winner = lastRound.matches[0].winner;
            // Set up final boss match
            newState.finalMatch = {
                id: 'final-boss-match',
                pod1: newState.winner,
                pod2: { ...FINAL_BOSS, id: 999 },
                winner: null,
                loser: null,
                moveHistory: [],
            };
            newState.currentMatchId = 'final-boss-match';
        }
    }
    
    setTournament(newState);
    saveState(newState);
  };

  const playFinalMatch = (pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.finalMatch) return;
     
    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const match = updatedTournament.finalMatch;

    if (!match || !match.pod1 || !match.pod2) {
        setIsProcessing(false);
        return;
    }

    let winner: Pod | null = null;
    let winningMove: Move | null = null;

    if (pod1Move !== pod2Move) {
        if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
            (pod1Move === 'scissors' && pod2Move === 'paper') ||
            (pod1Move === 'paper' && pod2Move === 'rock')) {
            winner = match.pod1;
            winningMove = pod1Move;
        } else {
            winner = match.pod2;
            winningMove = pod2Move;
        }
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    setTournament(updatedTournament);

    setTimeout(() => {
        if (winner && winningMove) {
            match.winner = winner;
            updatedTournament.gameWinner = winner;
            const finalState = { ...updatedTournament, matchWinner: { winner, winningMove }};
            setTournament(finalState);
            saveState(finalState);
            setTimeout(() => {
                const stateAfterWinner = { ...finalState, matchWinner: null };
                setTournament(stateAfterWinner);
                saveState(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);
        } else {
            match.isDraw = true;
            const drawState = {...updatedTournament};
            setTournament(drawState);
            saveState(drawState);
            toast({ title: "It's a draw!", description: "The boss is tough! Play again!" });
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                setTournament({...drawState});
                saveState(drawState);
                setIsProcessing(false);
            }, 2000);
        }
    }, 1000);
  };

  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament) return;

    if (tournament.currentMatchId === 'final-boss-match') {
        playFinalMatch(pod1Move, pod2Move);
        return;
    }

    if (!tournament.currentMatchId) return;

    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    let roundIndex: number | undefined;

    for (let i = 0; i < rounds.length; i++) {
        const m = rounds[i].matches.find((m: Match) => m.id === currentMatchId);
        if (m) {
            match = m;
            roundIndex = i;
            break;
        }
    }

    if (!match || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let loser: Pod | null = null;
    let winningMove: Move | null = null;

    if (pod1Move !== pod2Move) {
      if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
          (pod1Move === 'scissors' && pod2Move === 'paper') ||
          (pod1Move === 'paper' && pod2Move === 'rock')) {
        winner = match.pod1;
        loser = match.pod2;
        winningMove = pod1Move;
      } else {
        winner = match.pod2;
        loser = match.pod1;
        winningMove = pod2Move;
      }
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

    setTournament(updatedTournament);

    setTimeout(() => {
        if (winner && winningMove) {
            match!.winner = winner;
            match!.loser = loser;
            
            const finalState = JSON.parse(JSON.stringify(updatedTournament));
            finalState.matchWinner = { winner, winningMove };

            setTournament(finalState);
            saveState(finalState);

            setTimeout(() => {
                const stateAfterWinner = { ...finalState, matchWinner: null };
                if (typeof roundIndex !== 'undefined') {
                    advanceWinner(match!, roundIndex, stateAfterWinner.rounds);
                }
                advanceTournament(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);

        } else { 
            match!.isDraw = true;
            const drawState = JSON.parse(JSON.stringify(updatedTournament));
            setTournament(drawState);
            saveState(drawState);
            toast({ title: "It's a draw!", description: "Play again to decide the winner." });
            
            setTimeout(() => {
                match!.moves = undefined;
                match!.isDraw = false;
                const resetState = JSON.parse(JSON.stringify(drawState));
                setTournament(resetState);
                saveState(resetState);
                setIsProcessing(false);
            }, 2000);
        }
    }, 1000);


  }, [tournament, toast]);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
  }, []);
  
  const simulateTournament = useCallback(async () => {
    if (!tournament) return;
    setIsProcessing(true);

    let simTournament = JSON.parse(JSON.stringify(tournament));

    while(!simTournament.winner && simTournament.currentMatchId) {
        let currentMatchId = simTournament.currentMatchId;
        let roundIndex = -1;
        let matchIndex = -1;
        
        for(let r=0; r < simTournament.rounds.length; r++) {
            const mIdx = simTournament.rounds[r].matches.findIndex(m => m.id === currentMatchId);
            if (mIdx !== -1) {
                roundIndex = r;
                matchIndex = mIdx;
                break;
            }
        }
        
        if (roundIndex === -1) {
            // Should not happen, but as a safeguard
            break;
        }

        const match = simTournament.rounds[roundIndex].matches[matchIndex];
        
        if (!match.winner && !match.isBye && match.pod1 && match.pod2) {
            let pod1Move, pod2Move, winner;
            do {
                pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
                pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];
                
                if (pod1Move === pod2Move) {
                    winner = null;
                } else if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
                           (pod1Move === 'scissors' && pod2Move === 'paper') ||
                           (pod1Move === 'paper' && pod2Move === 'rock')) {
                    winner = match.pod1;
                } else {
                    winner = match.pod2;
                }
            } while(!winner);
            
            match.winner = winner;
            match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
            match.moves = { pod1: pod1Move, pod2: pod2Move };
            match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

            advanceWinner(match, roundIndex, simTournament.rounds);
        }
        
        // Find next match or winner
        let nextMatchId = null;
        
        findNext:
        for (const round of simTournament.rounds) {
            for (const m of round.matches) {
                if (!m.winner && m.pod1 && m.pod2) {
                    nextMatchId = m.id;
                    break findNext;
                }
            }
        }
        
        simTournament.currentMatchId = nextMatchId;

        if (!nextMatchId) {
            const lastRound = simTournament.rounds[simTournament.rounds.length - 1];
            if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
                simTournament.winner = lastRound.matches[0].winner;
            }
        }
    }
    
    // Setup final boss match
    if (simTournament.winner) {
        simTournament.finalMatch = {
            id: 'final-boss-match',
            pod1: simTournament.winner,
            pod2: { ...FINAL_BOSS, id: 999 },
            winner: null,
            loser: null,
            moveHistory: [],
        };
        simTournament.currentMatchId = 'final-boss-match';
    }

    setTournament(simTournament);
    saveState(simTournament);
    setIsProcessing(false);
  }, [tournament]);

  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          parsedState.matchWinner = null; 
          setTournament(parsedState);
        }
      } catch (error) {
        console.error("Could not load state from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    };
    loadState();
  }, []);

  const currentMatch = tournament && tournament.currentMatchId
    ? tournament.currentMatchId === 'final-boss-match'
        ? tournament.finalMatch
        : tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId
    ? tournament.currentMatchId === 'final-boss-match'
        ? 0 // Special value for final boss
        : tournament.rounds.findIndex(r => r.matches.some(m => m.id === tournament.currentMatchId)) + 1
    : null;

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    simulateTournament,
    currentMatch,
    winner: tournament?.winner ?? null,
    matchWinner: tournament?.matchWinner,
    gameWinner: tournament?.gameWinner ?? null,
    isProcessing,
    currentRound
  };
}
