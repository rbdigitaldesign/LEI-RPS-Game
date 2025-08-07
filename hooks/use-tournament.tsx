'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS } from '@/lib/constants';
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
        window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_STORAGE_KEY, newValue: stateString }));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_STORAGE_KEY, newValue: null }));
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

        rounds.push({ id: i + 1, matches: roundMatches });

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

  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    setIsProcessing(false);
  }, []);
  
  const advanceTournament = (currentState: TournamentState) => {
    setIsProcessing(true);
    
    const currentMatchId = currentState.currentMatchId;
    let currentRoundIndex = -1;
    let currentMatchIndex = -1;
    
    if (currentMatchId) {
      for (let r = 0; r < currentState.rounds.length; r++) {
        const matchIdx = currentState.rounds[r].matches.findIndex(m => m.id === currentMatchId);
        if (matchIdx !== -1) {
          currentRoundIndex = r;
          currentMatchIndex = matchIdx;
          break;
        }
      }
    }

    if (currentRoundIndex === -1) {
        setIsProcessing(false);
        return; 
    }
    
    const winnerOfLastMatch = currentState.rounds[currentRoundIndex].matches[currentMatchIndex].winner;
    
    const nextRoundIndex = currentRoundIndex + 1;
    if (winnerOfLastMatch && nextRoundIndex < currentState.rounds.length) {
      const nextMatchIndex = Math.floor(currentMatchIndex / 2);
      let matchInNextRound = currentState.rounds[nextRoundIndex].matches[nextMatchIndex];
      
      if(matchInNextRound) {
        if (currentMatchIndex % 2 === 0) {
            matchInNextRound.pod1 = winnerOfLastMatch;
        } else {
            matchInNextRound.pod2 = winnerOfLastMatch;
        }
      }
    }

    let nextMatchId: string | null = null;
    outerLoop: for (let r = 0; r < currentState.rounds.length; r++) {
      for (let m = 0; m < currentState.rounds[r].matches.length; m++) {
        const match = currentState.rounds[r].matches[m];
        if (!match.isBye && !match.winner && match.pod1 && match.pod2) {
          nextMatchId = match.id;
          break outerLoop;
        }
      }
    }

    currentState.currentMatchId = nextMatchId;
    
    if (!nextMatchId) {
       const lastRound = currentState.rounds[currentState.rounds.length - 1];
       if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
           currentState.winner = lastRound.matches[0].winner;
       }
    }
    
    setTournament({ ...currentState });
    saveState(currentState);
    
    setTimeout(() => {
        setIsProcessing(false);
    }, 500); 
  };

  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.currentMatchId) return;

    setIsProcessing(true);
    
    const updatedTournament = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    
    for (const round of rounds) {
      const m = round.matches.find((m: Match) => m.id === currentMatchId);
      if (m) {
        match = m;
        break;
      }
    }

    if (!match || match.isBye || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let loser: Pod | null = null;

    if (pod1Move !== pod2Move) {
      if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
          (pod1Move === 'scissors' && pod2Move === 'paper') ||
          (pod1Move === 'paper' && pod2Move === 'rock')) {
        winner = match.pod1;
        loser = match.pod2;
      } else {
        winner = match.pod2;
        loser = match.pod1;
      }
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    if (!match.moveHistory) {
      match.moveHistory = [];
    }
    match.moveHistory.push({ pod1: pod1Move, pod2: pod2Move });
    
    if (winner) {
      match.winner = winner;
      match.loser = loser;
    }
    
    const revealState = {...updatedTournament};
    setTournament(revealState);
    saveState(revealState);
    
    if (winner) {
        setTimeout(() => advanceTournament(updatedTournament), 5000);
    } else {
        setTimeout(() => {
          match.moves = undefined;
          setTournament({...updatedTournament});
          saveState(updatedTournament);
          setIsProcessing(false);
        }, 2000);
    }

  }, [tournament, toast]);

  const resetTournament = useCallback(() => {
    setIsProcessing(true);
    setTournament(null);
    saveState(null);
    setTimeout(() => setIsProcessing(false), 500);
  }, []);

  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          setTournament(JSON.parse(savedState));
        }
      } catch (error) {
        console.error("Could not load state from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    };
    loadState();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        try {
          if (event.newValue) {
            setTournament(JSON.parse(event.newValue));
          } else {
            setTournament(null);
          }
        } catch (error) {
          console.error("Error parsing stored state:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const currentMatch = tournament && tournament.currentMatchId
    ? tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId
    ? tournament.rounds.findIndex(r => r.matches.some(m => m.id === tournament.currentMatchId)) + 1
    : null;

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner: tournament?.winner ?? null,
    isProcessing,
    currentRound
  };
}
