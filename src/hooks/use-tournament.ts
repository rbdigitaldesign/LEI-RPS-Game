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
    let roundCounter = 1;

    // The number of pods for a balanced bracket should be a power of two.
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(currentPods.length));
    const byesNeeded = nextPowerOfTwo - currentPods.length;
    
    // Create pods with byes. These are just placeholders to make the array length a power of two.
    const podsWithByes = [...currentPods, ...Array(byesNeeded).fill(null)];

    const firstRoundMatches: Match[] = [];
    // The actual players in the first round are those that don't have a bye.
    const playingPods = currentPods.slice(byesNeeded);

    // The pods that get a bye advance automatically.
    const byePods = currentPods.slice(0, byesNeeded);
    
    byePods.forEach(pod => {
      firstRoundMatches.push({
        id: `r${roundCounter}-m-bye-${pod.id}`,
        pod1: pod,
        pod2: null,
        winner: pod,
        loser: null,
        isBye: true,
      });
    });
    
    for (let i = 0; i < playingPods.length; i += 2) {
      firstRoundMatches.push({
        id: `r${roundCounter}-m${i / 2 + byePods.length}`,
        pod1: playingPods[i],
        pod2: playingPods[i + 1],
        winner: null,
        loser: null,
      });
    }

    rounds.push({ id: roundCounter, matches: firstRoundMatches });
    
    let previousRoundWinners = firstRoundMatches.map(m => m.winner);

    while(previousRoundWinners.filter(p => p !== undefined).length > 1) {
      roundCounter++;
      const nextRoundMatches: Match[] = [];
      const podsForNextRound = previousRoundWinners.filter(Boolean);
      
      let matchIndex = 0;
      for (let i = 0; i < previousRoundWinners.length; i += 2) {
        const pod1 = previousRoundWinners[i];
        const pod2 = previousRoundWinners[i+1];
        
        const match: Match = {
          id: `r${roundCounter}-m${matchIndex}`,
          pod1: pod1 === undefined ? null : pod1,
          pod2: pod2 === undefined ? null : pod2,
          winner: null,
          loser: null,
        }
        nextRoundMatches.push(match);
        matchIndex++;
      }
      rounds.push({id: roundCounter, matches: nextRoundMatches});
      previousRoundWinners = nextRoundMatches.map(m => m.winner);
    }
    
    // This logic ensures we're creating placeholders for future rounds correctly.
    // We need to build the full bracket structure upfront.
    const finalRounds: Round[] = [];
    let roundPods = [...shuffledPods];
    roundCounter = 1;

    // Determine total rounds
    const totalRounds = Math.ceil(Math.log2(initialPods.length));
    
    let allMatches: Match[] = [];
    let byesCount = nextPowerOfTwo - roundPods.length;
    
    let firstRoundPlaying = roundPods.slice(byesCount);
    let firstRoundByes = roundPods.slice(0, byesCount);

    let r1Matches: Match[] = [];
    firstRoundByes.forEach(p => r1Matches.push({id:`r1-bye-${p.id}`, pod1:p, pod2: null, winner: p, isBye: true, loser: null}));
    for(let i=0; i<firstRoundPlaying.length; i+=2) {
        r1Matches.push({id:`r1-m${i/2}`, pod1: firstRoundPlaying[i], pod2: firstRoundPlaying[i+1], winner: null, loser:null});
    }
    finalRounds.push({id: 1, matches: r1Matches});
    
    let winners: (Pod | null)[] = r1Matches.map(m => m.winner);

    for(let r=2; r <= totalRounds; r++) {
        let nextRoundMatches: Match[] = [];
        for(let i=0; i < winners.length; i+=2) {
            nextRoundMatches.push({id:`r${r}-m${i/2}`, pod1: winners[i], pod2: winners[i+1], winner: null, loser: null});
        }
        finalRounds.push({id: r, matches: nextRoundMatches});
        winners = nextRoundMatches.map(m => m.winner);
    }
    
    return {
      pods: initialPods,
      rounds: finalRounds,
      currentMatchId: finalRounds[0].matches.find(m => !m.isBye)?.id || null,
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
      // The match in the next round corresponds to half the index of the current match
      const nextMatchIndex = Math.floor(currentMatchIndex / 2);
      let matchInNextRound = currentState.rounds[nextRoundIndex].matches[nextMatchIndex];
      
      if(matchInNextRound) {
        // Determine if current match winner is pod1 or pod2 in the next match.
        if (currentMatchIndex % 2 === 0) {
            matchInNextRound.pod1 = currentMatch.winner;
        } else {
            matchInNextRound.pod2 = currentMatch.winner;
        }
      }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    // Look in current round for an unplayed match
    for(let i = 0; i < currentState.rounds[currentRoundIndex].matches.length; i++) {
        if(!currentState.rounds[currentRoundIndex].matches[i].winner && !currentState.rounds[currentRoundIndex].matches[i].isBye) {
            nextMatchId = currentState.rounds[currentRoundIndex].matches[i].id;
            break;
        }
    }

    // If no unplayed matches in current round, look in next rounds
    if (!nextMatchId) {
        for(let r = currentRoundIndex + 1; r < currentState.rounds.length; r++) {
            const firstUnplayed = currentState.rounds[r].matches.find(m => !m.winner && m.pod1 && m.pod2);
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
    let roundIndex: number = -1;
    let matchIndex: number = -1;

    for (const [rIdx, round] of rounds.entries()) {
      const mIdx = round.matches.findIndex((m: Match) => m.id === currentMatchId);
      if (mIdx !== -1) {
        match = round.matches[mIdx];
        roundIndex = rIdx;
        matchIndex = mIdx;
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
