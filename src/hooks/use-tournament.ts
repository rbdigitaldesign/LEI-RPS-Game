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
    const round1: Round = { id: 1, matches: [] };
    rounds.push(round1);
    
    const podsWithByes = shuffledPods.slice(0, byes);
    const podsInFirstRound = shuffledPods.slice(byes);

    for (let i = 0; i < numFirstRoundMatches; i++) {
        const pod1 = podsInFirstRound.shift();
        const pod2 = podsInFirstRound.shift();
        round1.matches.push({
            id: `r1-m${i}`,
            pod1: pod1!,
            pod2: pod2!,
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }

    podsWithByes.forEach((pod, index) => {
        round1.matches.push({
            id: `r1-bye${index}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            isBye: true,
            moveHistory: [],
        });
    });
    
    let previousRoundWinners = round1.matches.map(m => m.winner).filter(Boolean) as (Pod | null)[];
    if (round1.matches.some(m => !m.winner)) {
        previousRoundWinners = new Array(round1.matches.length).fill(null);
    }

    let roundNum = 2;
    while (previousRoundWinners.length > 1) {
        const currentRound: Round = { id: roundNum, matches: [] };
        
        for (let i = 0; i < previousRoundWinners.length / 2; i++) {
            currentRound.matches.push({
                id: `r${roundNum}-m${i}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                moveHistory: [],
            });
        }
        rounds.push(currentRound);
        previousRoundWinners = currentRound.matches.map(() => null);
        roundNum++;
    }

    const firstPlayableMatch = rounds[0]?.matches.find(m => !m.isBye);

    return {
        pods: initialPods,
        rounds,
        currentMatchId: firstPlayableMatch?.id || null,
        winner: null,
    };
  };

  const advanceTournament = (currentState: TournamentState) => {
    setIsProcessing(true);
    
    const { currentMatchId } = currentState;
    if (!currentMatchId) {
        setIsProcessing(false);
        return;
    }

    let lastWinner: Pod | null = null;
    let lastMatchRoundIndex = -1;
    let lastMatchIndexInRound = -1;

    for (let r = 0; r < currentState.rounds.length; r++) {
        const matchIndex = currentState.rounds[r].matches.findIndex(m => m.id === currentMatchId);
        if (matchIndex > -1) {
            lastWinner = currentState.rounds[r].matches[matchIndex].winner;
            lastMatchRoundIndex = r;
            lastMatchIndexInRound = matchIndex;
            break;
        }
    }

    if (lastWinner && lastMatchRoundIndex < currentState.rounds.length - 1) {
        const nextRoundIndex = lastMatchRoundIndex + 1;
        
        // Find all winners from the current round, including byes
        const currentRoundWinners = currentState.rounds[lastMatchRoundIndex].matches
            .map(match => match.winner)
            .filter(Boolean);
            
        // Find the specific winner's new position
        const winnerPodId = lastWinner.id;
        const winnerList = currentState.rounds[lastMatchRoundIndex].matches.map(m => m.winner);
        const winnerIndexInRound = winnerList.findIndex(w => w?.id === winnerPodId);

        if (winnerIndexInRound !== -1) {
            const nextMatchIndex = Math.floor(winnerIndexInRound / 2);
            const nextMatch = currentState.rounds[nextRoundIndex].matches[nextMatchIndex];
    
            if (nextMatch) {
                if (winnerIndexInRound % 2 === 0) {
                    nextMatch.pod1 = lastWinner;
                } else {
                    nextMatch.pod2 = lastWinner;
                }
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
    
    if (!nextMatchId && lastWinner) {
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


  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    setIsProcessing(false);
  }, []);
  
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
        // It's a draw, reset for replay
        setTimeout(() => {
          if (match) match.moves = undefined;
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
