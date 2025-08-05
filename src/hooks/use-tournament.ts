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
    const byes = nextPowerOfTwo - numPods;
    const rounds: Round[] = [];
    const totalRounds = Math.log2(nextPowerOfTwo);
  
    let podsForCurrentRound: (Pod | null)[] = [...shuffledPods, ...Array(byes).fill(null)];
    let roundIndex = 0;
  
    while (roundIndex < totalRounds) {
      const matches: Match[] = [];
      const podsInThisRound = [...podsForCurrentRound];
      podsForCurrentRound = [];
  
      let matchIndex = 0;
      for (let i = 0; i < podsInThisRound.length; i += 2) {
        const pod1 = podsInThisRound[i];
        const pod2 = podsInThisRound[i + 1];
  
        const isBye = pod1 === null || pod2 === null;
        
        matches.push({
          id: `r${roundIndex + 1}-m${matchIndex++}`,
          pod1: pod1,
          pod2: pod2,
          winner: isBye ? (pod1 || pod2) : null,
          loser: null,
          isBye: isBye,
          moveHistory: [],
        });
      }
      
      rounds.push({ id: roundIndex + 1, matches });
      
      // Prepare for next round
      podsForCurrentRound = new Array(matches.length).fill(null);
      roundIndex++;
    }
    
    // The previous logic for byes was more complex than needed. This simplifies it.
    // Give byes to the first `byes` pods by pre-populating them as winners of the first round.
    if (byes > 0 && rounds.length > 0) {
      const firstRoundMatches = rounds[0].matches;
      const podsWithByes = shuffledPods.slice(0, byes);
      
      // Create a clean set of pods that will actually play in round 1
      const podsPlayingRound1 = shuffledPods.slice(byes);
      
      // Re-create the first round
      let r1Matches: Match[] = [];
      for(let i=0; i<podsPlayingRound1.length; i+=2) {
        r1Matches.push({
          id: `r1-m${i/2}`,
          pod1: podsPlayingRound1[i],
          pod2: podsPlayingRound1[i+1],
          winner: null,
          loser: null,
          moveHistory: [],
        })
      }

      // Add bye "matches"
      podsWithByes.forEach((pod, index) => {
        r1Matches.push({
          id: `r1-bye${index}`,
          pod1: pod,
          pod2: null,
          winner: pod,
          loser: null,
          isBye: true,
          moveHistory: [],
        })
      });

      rounds[0].matches = r1Matches;
    }


    const firstPlayableMatch = rounds[0]?.matches.find(m => !m.isBye && m.pod1 && m.pod2);
  
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
    
    // Propagate winners to the next round
    for (let r = 0; r < currentState.rounds.length - 1; r++) {
      const currentRound = currentState.rounds[r];
      const nextRound = currentState.rounds[r+1];
      for (let i = 0; i < currentRound.matches.length; i+=2) {
        const winner1 = currentRound.matches[i].winner;
        const winner2 = currentRound.matches[i+1]?.winner;
        const nextMatch = nextRound.matches[i/2];
        if (nextMatch) {
          nextMatch.pod1 = winner1;
          if(winner2 !== undefined) nextMatch.pod2 = winner2;
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
