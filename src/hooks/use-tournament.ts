'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES } from '@/lib/constants';
import type { TournamentState, Pod, Round, Match, Move } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'rps-pod-showdown-tournament';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// A short delay for showing match results during simulation
const SIMULATION_DELAY_MS = 1000;
const POST_WINNER_DELAY_MS = 2500;

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
    
    const rounds: Round[] = [];
    let podsInRound: (Pod | null)[] = [...shuffledPods];
    let roundNum = 1;

    // The number of byes in the first round
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byes = nextPowerOfTwo - numPods;

    // First round with potential byes
    const firstRound: Round = { id: roundNum, matches: [] };
    const podsWithByes = podsInRound.slice(0, byes);
    const podsInFirstMatches = podsInRound.slice(byes);

    // Add byes as completed matches
    podsWithByes.forEach((pod, index) => {
      firstRound.matches.push({
        id: `r${roundNum}-bye-${index}`,
        pod1: pod,
        pod2: null,
        winner: pod,
        loser: null,
        isBye: true,
        moveHistory: [],
      });
    });

    // Add first round matches
    for (let i = 0; i < podsInFirstMatches.length; i += 2) {
      firstRound.matches.push({
        id: `r${roundNum}-m${i / 2}`,
        pod1: podsInFirstMatches[i],
        pod2: podsInFirstMatches[i+1],
        winner: null,
        loser: null,
        moveHistory: [],
      });
    }

    rounds.push(firstRound);
    
    // Create subsequent rounds
    let numMatchesInPreviousRound = firstRound.matches.length;
    while(numMatchesInPreviousRound > 1) {
        roundNum++;
        const nextRound: Round = { id: roundNum, matches: [] };
        const numMatchesInNextRound = numMatchesInPreviousRound / 2;
        
        for (let i = 0; i < numMatchesInNextRound; i++) {
            nextRound.matches.push({
                id: `r${roundNum}-m${i}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                moveHistory: [],
            });
        }
        rounds.push(nextRound);
        numMatchesInPreviousRound = numMatchesInNextRound;
    }

    const firstPlayableMatch = rounds[0]?.matches.find(m => !m.isBye);

    return {
        pods: initialPods,
        rounds,
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

  const advanceTournament = useCallback((currentState: TournamentState): TournamentState => {
    const { currentMatchId, rounds } = currentState;
    if (!currentMatchId) {
        return currentState;
    }

    let currentRoundIndex = -1;
    let currentMatchIndexInRound = -1;

    for(let i = 0; i < rounds.length; i++) {
      const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
      if (matchIndex !== -1) {
        currentRoundIndex = i;
        currentMatchIndexInRound = matchIndex;
        break;
      }
    }
    
    if (currentRoundIndex === -1) {
      return currentState;
    }
    
    const lastWinner = rounds[currentRoundIndex].matches[currentMatchIndexInRound].winner;
    
    if (lastWinner && currentRoundIndex < rounds.length - 1) {
        const nextRoundIndex = currentRoundIndex + 1;
        const allMatchesInCurrentRound = rounds[currentRoundIndex].matches;
        
        // Count completed matches before the current one to find the correct slot in the next round
        const completedMatchesBefore = allMatchesInCurrentRound.slice(0, currentMatchIndexInRound).filter(m => m.winner).length;
        const byeMatchesBefore = allMatchesInCurrentRound.slice(0, currentMatchIndexInRound).filter(m => m.isBye).length;
        const winnerIndex = completedMatchesBefore + byeMatchesBefore;

        const nextMatchIndex = Math.floor(winnerIndex / 2);
        const nextMatch = rounds[nextRoundIndex]?.matches[nextMatchIndex];
        
        if (nextMatch) {
            if (winnerIndex % 2 === 0) {
                nextMatch.pod1 = lastWinner;
            } else {
                nextMatch.pod2 = lastWinner;
            }
        }
    }
    
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
    
    if (!nextMatchId && lastWinner) {
       const lastRound = rounds[rounds.length - 1];
       if (lastRound && lastRound.matches.length === 1 && lastRound.matches[0].winner) {
           currentState.winner = lastRound.matches[0].winner;
       }
    }
    
    return currentState;
  }, []);

  const playMatch = useCallback(async (pod1Move: Move, pod2Move: Move, isSimulation = false) => {
    if (isProcessing) return;

    setIsProcessing(true);

    // Find the current match from the current state
    const currentTournament = tournament;
    if (!currentTournament || !currentTournament.currentMatchId) {
        setIsProcessing(false);
        return;
    }
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(currentTournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    for (const round of rounds) {
        const m = round.matches.find((m: Match) => m.id === currentMatchId);
        if (m) { match = m; break; }
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
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];
    
    if (winner) {
        match.winner = winner;
        match.loser = loser;
    }
    
    // 1. Set state to show the result (winner or draw)
    setTournament(updatedTournament);
    saveState(updatedTournament);

    // 2. Wait for the result to be visible
    const delay = winner
      ? (isSimulation ? SIMULATION_DELAY_MS : POST_WINNER_DELAY_MS)
      : (isSimulation ? SIMULATION_DELAY_MS : 2000);

    await new Promise(resolve => setTimeout(resolve, delay));

    // 3. Prepare and set the next state
    if (winner) {
        const advancedState = advanceTournament(updatedTournament);
        setTournament(advancedState);
        saveState(advancedState);
    } else {
        // It's a draw, so just reset the moves for a replay
        if (match) match.moves = undefined;
        setTournament(updatedTournament);
        saveState(updatedTournament);
    }

    setIsProcessing(false);

  }, [tournament, isProcessing, advanceTournament]);
  
  const simulateTournament = useCallback(async () => {
    setIsProcessing(true);
    let currentTournamentState = tournament;

    while (currentTournamentState && !currentTournamentState.winner) {
        const currentMatchId = currentTournamentState.currentMatchId;
        if (!currentMatchId) break; // No more matches to play
        
        const pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
        const pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];

        // This is a simplified, synchronous version of playMatch for simulation
        let match: Match | undefined;
        let roundIndex = -1;
        let matchIndex = -1;
        for (let r=0; r < currentTournamentState.rounds.length; r++) {
            const mIdx = currentTournamentState.rounds[r].matches.findIndex(m => m.id === currentMatchId);
            if (mIdx > -1) {
                match = currentTournamentState.rounds[r].matches[mIdx];
                roundIndex = r;
                matchIndex = mIdx;
                break;
            }
        }
        
        if (!match || !match.pod1 || !match.pod2) break;

        let winner: Pod | null = null;
        if (pod1Move !== pod2Move) {
            winner = ((pod1Move === 'rock' && pod2Move === 'scissors') || (pod1Move === 'scissors' && pod2Move === 'paper') || (pod1Move === 'paper' && pod2Move === 'rock')) ? match.pod1 : match.pod2;
        }

        match.moves = { pod1: pod1Move, pod2: pod2Move };
        match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

        if (winner) {
            match.winner = winner;
            match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
            
            // Immediately advance and update state for the next loop iteration
            currentTournamentState = advanceTournament(JSON.parse(JSON.stringify(currentTournamentState)));
        } else {
             // It's a draw, just loop again on the same match
            match.moves = undefined; // Reset for display
        }
        
        // Update the UI after each step of the simulation
        setTournament(JSON.parse(JSON.stringify(currentTournamentState)));
        saveState(currentTournamentState);
        
        await new Promise(res => setTimeout(res, SIMULATION_DELAY_MS));
    }

    setIsProcessing(false);

}, [tournament, advanceTournament]);


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

  const winner = tournament?.winner ?? null;

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner,
    isProcessing,
    currentRound,
    simulateTournament,
  };
}
