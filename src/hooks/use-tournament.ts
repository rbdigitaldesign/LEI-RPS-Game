
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, FINAL_BOSS, MOVES } from '@/lib/constants';
import type { TournamentState, Pod, Match, Move, Round } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { shuffleArray } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'rps-pod-showdown-tournament';

export function useTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const saveState = (state: TournamentState | null) => {
    try {
      if (typeof window !== 'undefined') {
        if (state) {
          const stateString = JSON.stringify(state);
          localStorage.setItem(LOCAL_STORAGE_KEY, stateString);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  };

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    
    const numPods = shuffledPods.length;
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byesCount = nextPowerOfTwo - numPods;
    const totalRounds = Math.log2(nextPowerOfTwo);
    
    let rounds: Round[] = [];
    let currentPods: (Pod | null)[] = [...shuffledPods];
    
    // First round with byes
    const firstRoundMatches: Match[] = [];
    const podsWithByes = currentPods.slice(0, byesCount);
    const podsInFirstMatches = currentPods.slice(byesCount);

    podsWithByes.forEach((pod, k) => {
        firstRoundMatches.push({
            id: `r1-bye${k}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            played: true,
            isBye: true,
            moveHistory: [],
        });
    });

    for (let j = 0; j < podsInFirstMatches.length; j += 2) {
        firstRoundMatches.push({
            id: `r1-m${j/2}`,
            pod1: podsInFirstMatches[j],
            pod2: podsInFirstMatches[j + 1],
            winner: null,
            loser: null,
            played: false,
            moveHistory: [],
        });
    }
    rounds.push({ id: 1, matches: firstRoundMatches });

    // Subsequent rounds
    for (let i = 1; i < totalRounds; i++) {
        const previousRoundMatches = rounds[i - 1].matches;
        const nextRoundMatches: Match[] = [];
        let nextPods: (Pod | null)[] = new Array(previousRoundMatches.length).fill(null);
        
        // This part seems complex, let's simplify.
        // The winners from the previous round should populate the pods for this round's matches.
        
        for (let j = 0; j < previousRoundMatches.length / 2; j++) {
            nextRoundMatches.push({
                id: `r${i + 2}-m${j}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                played: false,
                moveHistory: [],
            });
        }
        rounds.push({ id: i + 2, matches: nextRoundMatches });
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
    const { rounds, currentMatchId } = currentState;
    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    if (currentMatchId) {
        for (let i = 0; i < rounds.length; i++) {
            const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
            if (matchIndex !== -1) {
                currentRoundIndex = i;
                currentMatchIndex = matchIndex;
                break;
            }
        }
    }

    if (currentRoundIndex === -1 || currentMatchIndex === -1) {
        // This case can happen if the last match was played
        const lastRound = rounds[rounds.length - 1];
        if(lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            currentState.winner = lastRound.matches[0].winner;
            setTimeout(() => {
                const finalState = JSON.parse(JSON.stringify(currentState));
                finalState.finalMatch = {
                    id: 'final-boss-match',
                    pod1: finalState.winner,
                    pod2: { ...FINAL_BOSS, id: 999 },
                    winner: null,
                    loser: null,
                    played: false,
                    moveHistory: [],
                };
                finalState.currentMatchId = 'final-boss-match';
                setTournament(finalState);
                saveState(finalState);
            }, 4000);
        }
        return;
    }
    
    const winner = rounds[currentRoundIndex].matches[currentMatchIndex].winner;

    // Advance to next round
    const nextRoundIndex = currentRoundIndex + 1;
    if (winner && nextRoundIndex < rounds.length) {
        const nextMatchIndex = Math.floor(currentMatchIndex / 2);
        const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];

        if (nextMatch) {
            if (currentMatchIndex % 2 === 0) {
                nextMatch.pod1 = winner;
            } else {
                nextMatch.pod2 = winner;
            }
        }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    for (const round of rounds) {
        const nextPlayableMatch = round.matches.find(m => !m.played && m.pod1 && m.pod2);
        if (nextPlayableMatch) {
            nextMatchId = nextPlayableMatch.id;
            break;
        }
    }
    
    currentState.currentMatchId = nextMatchId;

    if (!nextMatchId) {
        const lastRound = rounds[rounds.length - 1];
        if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            currentState.winner = lastRound.matches[0].winner;
            setTimeout(() => {
                const finalState = JSON.parse(JSON.stringify(currentState));
                finalState.finalMatch = {
                    id: 'final-boss-match',
                    pod1: finalState.winner,
                    pod2: { ...FINAL_BOSS, id: 999 },
                    winner: null,
                    loser: null,
                    played: false,
                    moveHistory: [],
                };
                finalState.currentMatchId = 'final-boss-match';
                setTournament(finalState);
                saveState(finalState);
            }, 4000);
        }
    }
    
    setTournament({ ...currentState });
    saveState(currentState);
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
    if (!tournament || !tournament.currentMatchId) return;

    if (tournament.currentMatchId === 'final-boss-match') {
        playFinalMatch(pod1Move, pod2Move);
        return;
    }

    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    
    for (const round of rounds) {
      const m = round.matches.find((m: Match) => m.id === currentMatchId);
      if (m) {
        match = m;
        break;
      }
    }

    if (!match || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let winningMove: Move | null = null;
    let loser: Pod | null = null;

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
    
    const revealState = {...updatedTournament, matchWinner: winner ? { winner, winningMove } : { isDraw: true }};
    setTournament(revealState);

    setTimeout(() => {
        
        if (winner) {
            match.played = true;
            match.winner = winner;
            match.loser = loser;

            setTimeout(() => {
                const stateAfterWinner = { ...updatedTournament, matchWinner: null };
                advanceTournament(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);

        } else { 
            match.isDraw = true;
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                const resetState = {...updatedTournament, matchWinner: null};
                setTournament(resetState);
                saveState(resetState);
                setIsProcessing(false);
            }, 2000);
        }
    }, 1000);

  }, [tournament]);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
  }, []);

  useEffect(() => {
    const loadState = () => {
      try {
        if (typeof window === 'undefined') return;
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Clear transient state on load
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

  const currentRound = tournament && currentMatch && tournament.rounds && currentMatch.id !== 'final-boss-match'
    ? tournament.rounds.findIndex(r => r.matches.some(m => m.id === currentMatch.id)) + 1
    : null;


  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner: tournament?.winner ?? null,
    matchWinner: tournament?.matchWinner,
    gameWinner: tournament?.gameWinner ?? null,
    isProcessing,
    currentRound
  };
}

    