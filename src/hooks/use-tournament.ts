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
    let roundNum = 1;

    // The number of byes in the first round
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byes = nextPowerOfTwo - numPods;

    // First round with potential byes
    const firstRound: Round = { id: roundNum, matches: [] };
    const podsWithByes = shuffledPods.slice(0, byes);
    const podsInFirstMatches = shuffledPods.slice(byes);

    // Add byes as completed matches
    podsWithByes.forEach((pod, index) => {
      if(pod) {
        firstRound.matches.push({
          id: `r${roundNum}-bye-${index}`,
          pod1: pod,
          pod2: null,
          winner: pod,
          loser: null,
          isBye: true,
          moveHistory: [],
        });
      }
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
    
    let numWinnersFromPreviousRound = firstRound.matches.length;
    while(numWinnersFromPreviousRound > 1) {
        roundNum++;
        const nextRound: Round = { id: roundNum, matches: [] };
        const numMatchesInNextRound = Math.ceil(numWinnersFromPreviousRound / 2);
        
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
        numWinnersFromPreviousRound = numMatchesInNextRound;
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
        const allWinnersInCurrentRound = rounds[currentRoundIndex].matches.map(m => m.winner).filter(Boolean);
        const winnerIndexInRound = allWinnersInCurrentRound.findIndex(w => w?.id === lastWinner.id);

        const nextMatchIndex = Math.floor(winnerIndexInRound / 2);
        const nextMatch = rounds[nextRoundIndex]?.matches[nextMatchIndex];
        
        if (nextMatch) {
            if (winnerIndexInRound % 2 === 0) {
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
    
    // Set state to show the result (winner or draw)
    setTournament(updatedTournament);
    saveState(updatedTournament);

    const delay = winner
      ? (isSimulation ? SIMULATION_DELAY_MS : POST_WINNER_DELAY_MS)
      : (isSimulation ? SIMULATION_DELAY_MS : 2000);

    await new Promise(resolve => setTimeout(resolve, delay));

    // Prepare and set the next state
    if (winner) {
        const advancedState = advanceTournament(updatedTournament);
        const finalState = JSON.parse(JSON.stringify(advancedState));
        setTournament(finalState);
        saveState(finalState);
    } else {
        // It's a draw, so just reset the moves for a replay
        if (match) match.moves = undefined;
        const finalState = JSON.parse(JSON.stringify(updatedTournament));
        setTournament(finalState);
        saveState(finalState);
    }

    setIsProcessing(false);

  }, [tournament, isProcessing, advanceTournament]);
  
  const simulateTournament = useCallback(async () => {
    setIsProcessing(true);
    let currentTournamentState = tournament;
  
    while (currentTournamentState && !currentTournamentState.winner) {
      const currentMatchId = currentTournamentState.currentMatchId;
      if (!currentMatchId) break;
  
      let match: Match | undefined;
      for (const round of currentTournamentState.rounds) {
        match = round.matches.find(m => m.id === currentMatchId);
        if (match) break;
      }
  
      if (!match || !match.pod1 || !match.pod2) break;
  
      let pod1Move: Move;
      let pod2Move: Move;
      let winner: Pod | null;
  
      // Loop until there is a winner for the current match
      do {
        pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
        pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];
  
        winner = null;
        if (pod1Move !== pod2Move) {
          if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
              (pod1Move === 'scissors' && pod2Move === 'paper') ||
              (pod1Move === 'paper' && pod2Move === 'rock')) {
            winner = match.pod1;
          } else {
            winner = match.pod2;
          }
        }
  
        match.moves = { pod1: pod1Move, pod2: pod2Move };
        match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];
  
        // Visually update for draw
        if (!winner) {
          const drawState = JSON.parse(JSON.stringify(currentTournamentState));
          setTournament(drawState);
          saveState(drawState);
          await new Promise(res => setTimeout(res, SIMULATION_DELAY_MS));
          match.moves = undefined; // Reset for next attempt in simulation
        }
      } while (!winner);
  
      match.winner = winner;
      match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
      
      const winnerState = JSON.parse(JSON.stringify(currentTournamentState));
      setTournament(winnerState);
      saveState(winnerState);
      await new Promise(res => setTimeout(res, SIMULATION_DELAY_MS));
  
      currentTournamentState = advanceTournament(winnerState);
      const finalState = JSON.parse(JSON.stringify(currentTournamentState));
      setTournament(finalState);
      saveState(finalState);
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

  const currentRound = tournament && currentMatch
    ? tournament.rounds.find(r => r.matches.some(m => m.id === currentMatch.id))?.id ?? null
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
