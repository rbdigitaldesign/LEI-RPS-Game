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
    let roundNum = 1;
    let podsForRound = [...shuffledPods];

    // Round 1
    const round1: Round = { id: roundNum, matches: [] };
    const podsWithByes = podsForRound.slice(0, byes);
    const podsInFirstRound = podsForRound.slice(byes);
    
    podsWithByes.forEach((pod, index) => {
      round1.matches.push({
        id: `r1-bye-${pod.id}`,
        pod1: pod,
        pod2: null,
        winner: pod,
        loser: null,
        isBye: true,
        moveHistory: [],
      });
    });

    for (let i = 0; i < numFirstRoundMatches; i++) {
        const pod1 = podsInFirstRound[i * 2];
        const pod2 = podsInFirstRound[i * 2 + 1];
        round1.matches.push({
            id: `r1-m${i}`,
            pod1: pod1,
            pod2: pod2,
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }
    rounds.push(round1);
    
    let winnersFromPreviousRound: (Pod | null)[] = round1.matches.map(m => m.winner);
    let numMatchesInRound = round1.matches.length;
    
    // Subsequent rounds
    while(winnersFromPreviousRound.length > 1) {
      roundNum++;
      const nextRound: Round = {id: roundNum, matches: []};
      const numMatchesInNextRound = Math.ceil(winnersFromPreviousRound.filter(w => w !== null).length / 2) + Math.floor(winnersFromPreviousRound.filter(w => w === null).length / 2);
      
      let podIndex = 0;
      for (let i=0; i < numMatchesInNextRound; i++) {
        const pod1 = winnersFromPreviousRound[podIndex++];
        const pod2 = winnersFromPreviousRound[podIndex++];
        nextRound.matches.push({
          id: `r${roundNum}-m${i}`,
          pod1: pod1 || null,
          pod2: pod2 || null,
          winner: null,
          loser: null,
          moveHistory: [],
        });
      }
      rounds.push(nextRound);
      winnersFromPreviousRound = new Array(nextRound.matches.length).fill(null);
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
    
    const { currentMatchId, rounds } = currentState;
    if (!currentMatchId) {
        setIsProcessing(false);
        return;
    }

    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    for(let i = 0; i < rounds.length; i++) {
      const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
      if (matchIndex !== -1) {
        currentRoundIndex = i;
        currentMatchIndex = matchIndex;
        break;
      }
    }
    
    if (currentRoundIndex === -1) {
      setIsProcessing(false);
      return;
    }
    
    const lastWinner = rounds[currentRoundIndex].matches[currentMatchIndex].winner;

    // Advance winner to the next round's match
    if (lastWinner && currentRoundIndex < rounds.length - 1) {
        const allWinnersFromRound = rounds[currentRoundIndex].matches.map(m => m.winner);
        let winnerCount = 0;
        for(let i=0; i <= currentMatchIndex; i++) {
            if (rounds[currentRoundIndex].matches[i].winner) {
                winnerCount++;
            }
        }
        
        const nextRoundIndex = currentRoundIndex + 1;
        const nextMatchIndex = Math.floor((winnerCount -1) / 2);
        const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
        
        if (nextMatch) {
            if ((winnerCount - 1) % 2 === 0) {
                nextMatch.pod1 = lastWinner;
            } else {
                nextMatch.pod2 = lastWinner;
            }
        }
    }
    
    // Find the next match to play
    let nextMatchId: string | null = null;
    outerLoop: for (let r = 0; r < rounds.length; r++) {
      for (let m = 0; m < rounds[r].matches.length; m++) {
        const match = rounds[r].matches[m];
        if (!match.isBye && !match.winner && match.pod1 && match.pod2) {
          nextMatchId = match.id;
          break outerLoop;
        }
      }
    }
    
    currentState.currentMatchId = nextMatchId;
    
    // If no next match, declare winner
    if (!nextMatchId && lastWinner) {
       const lastRound = rounds[rounds.length - 1];
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
    ? tournament.rounds.find(r => r.matches.some(m => m.id === tournament.currentMatchId))?.id ?? null
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
