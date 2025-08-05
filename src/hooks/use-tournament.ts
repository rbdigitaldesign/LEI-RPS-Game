'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES } from '@/lib/constants';
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
  
  const updateTournamentState = (newState: Partial<TournamentState>) => {
    setTournament(prev => {
      if (!prev) return null;
      const updatedState = { ...prev, ...newState };
      saveState(updatedState);
      return updatedState;
    });
  };

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    const numPods = shuffledPods.length;
    const rounds: Round[] = [];
    let currentPods = [...shuffledPods];
    let roundCounter = 0;

    while (currentPods.length > 1) {
      roundCounter++;
      const roundMatches: Match[] = [];
      const nextRoundPods: Pod[] = [];
      const numMatches = currentPods.length / 2;
      
      let podsInPlay = [...currentPods];
      
      // Handle non-power-of-two numbers for byes
      const powerOfTwo = 2 ** Math.floor(Math.log2(currentPods.length));
      if (currentPods.length !== powerOfTwo) {
        const numByes = powerOfTwo * 2 - currentPods.length;
        const byePods = podsInPlay.splice(0, numByes);
        nextRoundPods.push(...byePods);
        
        byePods.forEach(pod => {
            roundMatches.push({
                id: `r${roundCounter}-m-bye-${pod.id}`,
                pod1: pod,
                pod2: null,
                winner: pod,
                loser: null,
                isBye: true,
            });
        });
      }
      
      for (let i = 0; i < podsInPlay.length; i += 2) {
        roundMatches.push({
          id: `r${roundCounter}-m${i / 2}`,
          pod1: podsInPlay[i],
          pod2: podsInPlay[i + 1],
          winner: null,
          loser: null,
        });
      }

      rounds.push({ id: roundCounter, matches: roundMatches });
      
      const winners = roundMatches.filter(m => m.winner).map(m => m.winner!);
      currentPods = [...nextRoundPods, ...Array(Math.floor(podsInPlay.length / 2)).fill(null)];
    }

    return {
      pods: initialPods,
      rounds,
      currentRoundIndex: 0,
      currentMatchIndex: 0,
      winner: null,
    };
  };

  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    
    // Find the first actual match to play
    const firstPlayableMatch = newTournament.rounds[0].matches.findIndex(m => !m.isBye);
    if(firstPlayableMatch !== -1) {
        newTournament.currentMatchIndex = firstPlayableMatch;
    }
    
    setTournament(newTournament);
    saveState(newTournament);

    setTimeout(() => {
      setIsProcessing(false);
      processNextMatch(newTournament);
    }, 500);
  }, []);

  const processNextMatch = useCallback(async (currentState: TournamentState) => {
    if (currentState.winner) return;

    setIsProcessing(true);

    let { currentRoundIndex, currentMatchIndex } = currentState;
    let currentRound = currentState.rounds[currentRoundIndex];

    if (!currentRound || currentMatchIndex >= currentRound.matches.length) {
      // Move to next round
      const winners = currentRound.matches.map(m => m.winner).filter(Boolean) as Pod[];
      if(winners.length === 1) {
        const finalState = { ...currentState, winner: winners[0] };
        setTournament(finalState);
        saveState(finalState);
        setIsProcessing(false);
        return;
      }
      
      currentRoundIndex++;
      currentMatchIndex = 0;
      currentRound = currentState.rounds[currentRoundIndex];

      if (!currentRound) {
        // This case should be handled by the winner check above.
        const finalWinner = currentState.rounds[currentState.rounds.length - 1].matches[0].winner;
        if (finalWinner) {
            const finalState = { ...currentState, winner: finalWinner };
            setTournament(finalState);
            saveState(finalState);
        }
        setIsProcessing(false);
        return;
      }
      
      // Populate next round with winners
      const newMatches: Match[] = [];
      for(let i=0; i<winners.length; i+=2) {
        newMatches.push({
          id: `r${currentRoundIndex + 1}-m${i / 2}`,
          pod1: winners[i],
          pod2: winners[i+1],
          winner: null,
          loser: null,
        });
      }
      currentState.rounds[currentRoundIndex].matches = newMatches;
    }
    
    const match = currentState.rounds[currentRoundIndex].matches[currentMatchIndex];
    if (match.isBye || match.winner) {
        // Skip byes and already played matches
        const nextState = { ...currentState, currentMatchIndex: currentMatchIndex + 1 };
        setTournament(nextState);
        saveState(nextState);
        setTimeout(() => processNextMatch(nextState), 100);
        return;
    }

    // Play the match
    const move1 = MOVES[Math.floor(Math.random() * MOVES.length)];
    const move2 = MOVES[Math.floor(Math.random() * MOVES.length)];
    
    let outcome = 'Draw';
    let winner: Pod | null = null;
    let loser: Pod | null = null;
    
    if (move1 !== move2) {
      if ((move1 === 'rock' && move2 === 'scissors') ||
          (move1 === 'scissors' && move2 === 'paper') ||
          (move1 === 'paper' && move2 === 'rock')) {
        winner = match.pod1;
        loser = match.pod2;
        outcome = `${winner!.name} wins`;
      } else {
        winner = match.pod2;
        loser = match.pod1;
        outcome = `${winner!.name} wins`;
      }
    }
    
    match.moves = { pod1: move1, pod2: move2 };
    match.commentary = `${match.pod1!.name} plays ${move1}, ${match.pod2!.name} plays ${move2}. ${outcome}.`;

    if (winner && loser) {
      match.winner = winner;
      match.loser = loser;
      
      const updatedState = { ...currentState, currentMatchIndex: currentMatchIndex + 1 };
      setTournament(updatedState);
      saveState(updatedState);

      setTimeout(() => processNextMatch(updatedState), 5000); // Wait 5s for next match
    } else {
      // It's a draw, replay the match
      const stateWithMoves = { ...currentState };
      setTournament(stateWithMoves);
      saveState(stateWithMoves);
      setTimeout(() => processNextMatch(currentState), 5000); // Replay after 5s
    }

  }, [toast]);

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

  const currentMatch = tournament && tournament.rounds[tournament.currentRoundIndex]
    ? tournament.rounds[tournament.currentRoundIndex].matches[tournament.currentMatchIndex]
    : null;

  return {
    tournament,
    startTournament,
    resetTournament,
    currentMatch,
    winner: tournament?.winner ?? null,
    isProcessing
  };
}
