
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
                played: false,
                moveHistory: [],
            });
        }
        
        if (isFirstRound) {
            byePods.forEach((pod, k) => {
                const byeMatch: Match = {
                    id: `r${i + 1}-bye${k}`,
                    pod1: pod,
                    pod2: null,
                    winner: pod,
                    loser: null,
                    played: true,
                    isBye: true,
                    moveHistory: [],
                };
                roundMatches.unshift(byeMatch);
            });
        }

        rounds.push({ id: i + 1, matches: roundMatches });
        
        let nextRoundPods: (Pod | null)[] = [];
        for (const match of roundMatches) {
            if (match.winner) {
                nextRoundPods.push(match.winner);
            } else {
                nextRoundPods.push(null);
            }
        }
        podsForNextRound = new Array(Math.ceil(roundMatches.length / 2) * 2).fill(null);
    }

    // Set up subsequent rounds structure
    for (let i = 0; i < totalRounds - 1; i++) {
        const currentRound = rounds[i];
        const nextRound = rounds[i+1];
        for(let j=0; j < currentRound.matches.length; j+=2) {
             const nextMatchIndex = Math.floor(j/2);
             if (nextRound.matches[nextMatchIndex]) {
                 nextRound.matches[nextMatchIndex].pod1 = currentRound.matches[j].winner;
                 nextRound.matches[nextMatchIndex].pod2 = currentRound.matches[j+1]?.winner || null;
             }
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

    if (currentRoundIndex === -1 || currentMatchIndex === -1) return;

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
        const nextMatch = round.matches.find(m => !m.played && m.pod1 && m.pod2);
        if (nextMatch) {
            nextMatchId = nextMatch.id;
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

    const winner = match.pod1;
    const winningMove = pod1Move;

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
        match.played = true;
        if (winner) {
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

  const currentRound = tournament && currentMatch && tournament.rounds
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

    