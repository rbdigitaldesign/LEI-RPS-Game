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
    const rounds: Round[] = [];
    let currentPods = [...shuffledPods];
    let roundCounter = 0;

    // Handle initial bye round if number of pods is not a power of two
    const powerOfTwo = 2 ** Math.floor(Math.log2(currentPods.length));
    const byesNeeded = powerOfTwo * 2 - currentPods.length;
    
    const firstRoundMatches: Match[] = [];
    const podsWithByes = currentPods.slice(0, byesNeeded);
    const podsInFirstRound = currentPods.slice(byesNeeded);

    roundCounter++;
    
    podsWithByes.forEach(pod => {
        firstRoundMatches.push({
            id: `r${roundCounter}-m-bye-${pod.id}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            isBye: true,
        });
    });

    for (let i = 0; i < podsInFirstRound.length; i += 2) {
      firstRoundMatches.push({
        id: `r${roundCounter}-m${i / 2}`,
        pod1: podsInFirstRound[i],
        pod2: podsInFirstRound[i + 1],
        winner: null,
        loser: null,
      });
    }

    rounds.push({ id: roundCounter, matches: firstRoundMatches });
    
    let nextRoundPods = firstRoundMatches.map(m => m.winner).filter(Boolean) as Pod[];
    
    while(nextRoundPods.length > 1 || rounds[rounds.length-1].matches.some(m => !m.winner)) {
        const podsForThisRound = [...nextRoundPods];
        nextRoundPods = [];
        roundCounter++;
        const roundMatches: Match[] = [];
        
        const unplayedMatches = rounds[rounds.length-1].matches.filter(m => !m.winner);
        const winnersFromPreviousRound = rounds[rounds.length-1].matches.filter(m => m.winner).map(m => m.winner!);

        let podsToMatch = [...winnersFromPreviousRound];

        for(let i=0; i<unplayedMatches.length; i++) {
            podsToMatch.push(null as any); // Placeholder for winner
        }

        for (let i = 0; i < podsToMatch.length; i += 2) {
            roundMatches.push({
              id: `r${roundCounter}-m${i / 2}`,
              pod1: podsToMatch[i],
              pod2: podsToMatch[i + 1],
              winner: null,
              loser: null,
            });
        }
        if (roundMatches.length > 0) {
          rounds.push({ id: roundCounter, matches: roundMatches });
        } else if (nextRoundPods.length === 1) {
          break;
        }

    }


    return {
      pods: initialPods,
      rounds,
      currentMatchId: firstRoundMatches.find(m => !m.isBye)?.id || null,
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
    
    // Find current match and round
    const { currentMatchId } = currentState;
    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    if (currentMatchId) {
        for(let r=0; r < currentState.rounds.length; r++) {
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
        return; // Should not happen
    }
    
    const currentMatch = currentState.rounds[currentRoundIndex].matches[currentMatchIndex];
    
    // Populate winner to next round
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex < currentState.rounds.length) {
      let matchInNextRound = currentState.rounds[nextRoundIndex].matches.find(
        m => m.pod1 === null || m.pod2 === null
      );
      if (matchInNextRound) {
        if(matchInNextRound.pod1 === null) {
          matchInNextRound.pod1 = currentMatch.winner;
        } else {
          matchInNextRound.pod2 = currentMatch.winner;
        }
      }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    // Look in current round
    for(let i = currentMatchIndex + 1; i < currentState.rounds[currentRoundIndex].matches.length; i++) {
        if(!currentState.rounds[currentRoundIndex].matches[i].winner) {
            nextMatchId = currentState.rounds[currentRoundIndex].matches[i].id;
            break;
        }
    }

    // Look in next rounds
    if (!nextMatchId) {
        for(let r = currentRoundIndex + 1; r < currentState.rounds.length; r++) {
            const firstUnplayed = currentState.rounds[r].matches.find(m => !m.winner);
            if (firstUnplayed) {
                nextMatchId = firstUnplayed.id;
                break;
            }
        }
    }

    currentState.currentMatchId = nextMatchId;
    
    // Check for overall winner
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
    }, 2000); // Give time for animations and state to settle
  };

  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.currentMatchId) return;

    setIsProcessing(true);
    
    const updatedTournament = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    for (const round of rounds) {
      match = round.matches.find((m: Match) => m.id === currentMatchId);
      if (match) break;
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
    match.winner = winner;
    match.loser = loser;
    
    if (winner) {
        toast({ title: `${winner.name} wins!`, description: `${pod1Move} beats ${pod2Move}` });
        setTournament(updatedTournament); // Show result immediately
        saveState(updatedTournament);
        setTimeout(() => advanceTournament(updatedTournament), 2000);
    } else {
        toast({ title: "It's a draw!", description: `Both played ${pod1Move}. Replay the match.`, variant: 'destructive' });
        const tempState = {...updatedTournament};
        setTournament(tempState); // Show draw result
        saveState(tempState);
        setTimeout(() => {
          // Reset match state for replay
          match.moves = undefined;
          match.winner = null;
          match.loser = null;
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

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner: tournament?.winner ?? null,
    isProcessing
  };
}
