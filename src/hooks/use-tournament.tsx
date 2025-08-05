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
    
    // The number of pods for a balanced bracket should be a power of two.
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(shuffledPods.length));
    
    // Determine total rounds
    const totalRounds = Math.ceil(Math.log2(shuffledPods.length));
    
    let finalRounds: Round[] = [];
    let byesCount = nextPowerOfTwo - shuffledPods.length;
    
    let firstRoundPlaying = shuffledPods.slice(byesCount);
    let firstRoundByes = shuffledPods.slice(0, byesCount);

    let r1Matches: Match[] = [];
    firstRoundByes.forEach(p => r1Matches.push({id:`r1-bye-${p.id}`, pod1:p, pod2: null, winner: p, isBye: true, loser: null}));
    
    let matchCounter = 0;
    for(let i=0; i<firstRoundPlaying.length; i+=2) {
        r1Matches.push({id:`r1-m${matchCounter}`, pod1: firstRoundPlaying[i], pod2: firstRoundPlaying[i+1], winner: null, loser:null});
        matchCounter++;
    }
    // Sort first round matches so byes are distributed
    r1Matches.sort((a, b) => a.id.localeCompare(b.id));

    finalRounds.push({id: 1, matches: r1Matches});
    
    let previousRoundMatches = r1Matches;

    for(let r=2; r <= totalRounds; r++) {
        let nextRoundMatches: Match[] = [];
        for(let i=0; i < previousRoundMatches.length; i+=2) {
            const pod1 = previousRoundMatches[i]?.winner;
            const pod2 = previousRoundMatches[i+1]?.winner;
            nextRoundMatches.push({id:`r${r}-m${i/2}`, pod1: pod1 ?? null, pod2: pod2 ?? null, winner: null, loser: null});
        }
        finalRounds.push({id: r, matches: nextRoundMatches});
        previousRoundMatches = nextRoundMatches;
    }
    
    const firstPlayableMatch = finalRounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

    return {
      pods: initialPods,
      rounds: finalRounds,
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
    let matchFromState: Match | null = null;
    
    if (currentMatchId) {
      for (let r = 0; r < currentState.rounds.length; r++) {
        const matchIdx = currentState.rounds[r].matches.findIndex(m => m.id === currentMatchId);
        if (matchIdx !== -1) {
          currentRoundIndex = r;
          matchFromState = currentState.rounds[r].matches[matchIdx];
          break;
        }
      }
    }

    if (currentRoundIndex === -1 || !matchFromState) {
        setIsProcessing(false);
        return; 
    }
    
    const winnerOfLastMatch = matchFromState.winner;
    
    const nextRoundIndex = currentRoundIndex + 1;
    if (winnerOfLastMatch && nextRoundIndex < currentState.rounds.length) {
      const allMatchesInRound = currentState.rounds[currentRoundIndex].matches;
      const trueMatchIndex = allMatchesInRound.findIndex(m => m.id === currentMatchId);
      const nextMatchIndex = Math.floor(trueMatchIndex / 2);

      let matchInNextRound = currentState.rounds[nextRoundIndex].matches[nextMatchIndex];
      
      if(matchInNextRound) {
        if (trueMatchIndex % 2 === 0) {
            matchInNextRound.pod1 = winnerOfLastMatch;
        } else {
            matchInNextRound.pod2 = winnerOfLastMatch;
        }
      }
    }

    // Find next match to play
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
    match.winner = winner;
    match.loser = loser;
    
    const revealState = {...updatedTournament};
    setTournament(revealState);
    saveState(revealState);
    
    if (winner) {
        setTimeout(() => advanceTournament(updatedTournament), 5000); // Increased delay for winner screen
    } else {
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
