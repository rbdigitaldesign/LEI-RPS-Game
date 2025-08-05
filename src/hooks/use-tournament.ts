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
    
    if (numPods < 2) {
      return {
        pods: initialPods,
        rounds: [],
        currentMatchId: null,
        winner: numPods === 1 ? shuffledPods[0] : null,
      };
    }
    
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byes = nextPowerOfTwo - numPods;
    const numFirstRoundMatches = (numPods - byes) / 2;
    const rounds: Round[] = [];
    
    let podsForRound1 = [...shuffledPods];
    const firstRound: Round = { id: 1, matches: [] };
    
    // Create first round matches
    for (let i = 0; i < numFirstRoundMatches; i++) {
        const pod1 = podsForRound1.pop()!;
        const pod2 = podsForRound1.pop()!;
        firstRound.matches.push({
            id: `r1-m${i}`,
            pod1,
            pod2,
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }

    // Assign byes
    const podsWithByes = podsForRound1; // Remaining pods get a bye
    podsWithByes.forEach((pod, index) => {
        firstRound.matches.push({
            id: `r1-bye${index}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            isBye: true,
            moveHistory: [],
        });
    });
    
    rounds.push(firstRound);
    
    let numMatchesInPreviousRound = firstRound.matches.length;
    
    for (let roundIndex = 1; roundIndex < Math.log2(nextPowerOfTwo); roundIndex++) {
        const numMatchesInCurrentRound = numMatchesInPreviousRound / 2;
        const currentRound: Round = { id: roundIndex + 1, matches: [] };
        for (let matchIndex = 0; matchIndex < numMatchesInCurrentRound; matchIndex++) {
            currentRound.matches.push({
                id: `r${roundIndex + 1}-m${matchIndex}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                moveHistory: [],
            });
        }
        rounds.push(currentRound);
        numMatchesInPreviousRound = numMatchesInCurrentRound;
    }
  
    // Pre-populate winners from byes into round 2
    const round1ByeWinners = firstRound.matches.filter(m => m.isBye).map(m => m.winner);
    const round1MatchWinners = new Array(numFirstRoundMatches).fill(null);
    const round2Entrants = [...round1MatchWinners, ...round1ByeWinners];

    if (rounds[1]) {
        for(let i=0; i<rounds[1].matches.length; i++) {
            rounds[1].matches[i].pod1 = round2Entrants[i*2];
            rounds[1].matches[i].pod2 = round2Entrants[i*2+1];
        }
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
    
    // Propagate winners to the next round
    for (let r = 0; r < currentState.rounds.length - 1; r++) {
      const currentRound = currentState.rounds[r];
      const nextRound = currentState.rounds[r+1];
      for (let i = 0; i < currentRound.matches.length; i += 2) {
        const winner1 = currentRound.matches[i].winner;
        const winner2 = currentRound.matches[i+1]?.winner;
        const nextMatchIndex = i / 2;
        const nextMatch = nextRound.matches[nextMatchIndex];

        if (nextMatch) {
            if (nextMatch.pod1 === null) nextMatch.pod1 = winner1;
            if (nextMatch.pod2 === null && winner2 !== undefined) nextMatch.pod2 = winner2;
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
       if (lastRound && lastRound.matches.length === 1 && lastRound.matches[0].winner) {
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
          if (match) match.moves = undefined;
          setTournament({...updatedTournament});
          saveState(updatedTournament);
          setIsProcessing(false);
        }, 2000);
    }

  }, [tournament, toast, advanceTournament]);

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
