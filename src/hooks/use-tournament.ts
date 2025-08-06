
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
          
          if(nextMatchIndex < rounds[nextRoundIndex].matches.length) {
            const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
            if (currentMatchIndex % 2 === 0) {
                nextMatch.pod1 = match.winner;
            } else {
                nextMatch.pod2 = match.winner;
            }
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

    let firstRoundPods = [...shuffledPods];
    let byeMatches: Match[] = [];
    if(byesCount > 0){
        const byePods = firstRoundPods.splice(0, byesCount);
        byeMatches = byePods.map((pod, i) => ({
            id: `r1-bye${i}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            isBye: true,
            moveHistory: []
        }));
    }
    
    let firstRoundMatches: Match[] = [];
    for(let i=0; i < firstRoundPods.length; i+=2){
        firstRoundMatches.push({
            id: `r1-m${i/2}`,
            pod1: firstRoundPods[i],
            pod2: firstRoundPods[i+1],
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }

    rounds[0].matches = [...firstRoundMatches, ...byeMatches];
    
    rounds[0].matches.forEach((match) => {
        if(match.winner){
            advanceWinner(match, 0, rounds);
        }
    });

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
        const lastRound = currentState.rounds[currentState.rounds.length - 1];
        if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            newState.winner = lastRound.matches[0].winner;
             // Delay setting up final boss match to show winner screen
            setTimeout(() => {
                const finalState = JSON.parse(JSON.stringify(newState));
                finalState.finalMatch = {
                    id: 'final-boss-match',
                    pod1: finalState.winner,
                    pod2: { ...FINAL_BOSS, id: 999 },
                    winner: null,
                    loser: null,
                    moveHistory: [],
                };
                finalState.currentMatchId = 'final-boss-match';
                setTournament(finalState);
                saveState(finalState);
            }, 4000); // 4 second delay
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
            const drawState = {...updatedTournament, matchWinner: { isDraw: true }};
            setTournament(drawState);
            saveState(drawState);
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                const resetState = {...drawState, matchWinner: null};
                setTournament(resetState);
                saveState(resetState);
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
            const drawState = {...JSON.parse(JSON.stringify(updatedTournament)), matchWinner: { isDraw: true }};
            setTournament(drawState);
            saveState(drawState);
            
            setTimeout(() => {
                match!.moves = undefined;
                match!.isDraw = false;
                const resetState = {...drawState, matchWinner: null};
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

    // Simulate all rounds
    simTournament.rounds.forEach((round: Round, roundIndex: number) => {
        round.matches.forEach(match => {
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
        });
    });

    const lastRound = simTournament.rounds[simTournament.rounds.length - 1];
    if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
        simTournament.winner = lastRound.matches[0].winner;
    }
    
    simTournament.currentMatchId = null; // Simulation done
    setTournament(simTournament);
    saveState(simTournament);
    
    // Now handle the final boss setup
     if (simTournament.winner) {
        setTimeout(() => {
            const finalState = JSON.parse(JSON.stringify(simTournament));
            finalState.finalMatch = {
                id: 'final-boss-match',
                pod1: finalState.winner,
                pod2: { ...FINAL_BOSS, id: 999 },
                winner: null,
                loser: null,
                moveHistory: [],
            };
            finalState.currentMatchId = 'final-boss-match';
            setTournament(finalState);
            saveState(finalState);
            setIsProcessing(false);
        }, 4000); // Wait for the winner announcement
    } else {
        setIsProcessing(false);
    }

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
