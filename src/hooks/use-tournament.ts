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

  const advanceTournament = useCallback((currentState: TournamentState) => {
    const { currentMatchId, rounds } = currentState;
    if (!currentMatchId) {
        return;
    }

    let currentRoundIndex = -1;
    let currentMatchIndex = -1;
    let currentMatchInRound = -1;

    for(let i = 0; i < rounds.length; i++) {
      const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
      if (matchIndex !== -1) {
        currentRoundIndex = i;
        currentMatchInRound = matchIndex;
        break;
      }
    }
    
    if (currentRoundIndex === -1) {
      return;
    }
    
    const lastWinner = rounds[currentRoundIndex].matches[currentMatchInRound].winner;
    const allMatchesInRound = rounds[currentRoundIndex].matches;
    
    // Find the winner's index among the actual matches played (not byes)
    let winnerIndex = -1;
    let completedMatchesCount = 0;
    for(let i = 0; i < allMatchesInRound.length; i++) {
        if(allMatchesInRound[i].winner) {
            completedMatchesCount++;
        }
        if(i === currentMatchInRound) {
            winnerIndex = completedMatchesCount -1;
        }
    }

    if (lastWinner && currentRoundIndex < rounds.length - 1) {
        const nextRoundIndex = currentRoundIndex + 1;
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

  const playMatch = useCallback((pod1Move: Move, pod2Move: Move, isSimulation = false) => {
    return new Promise<void>(resolve => {
        setTournament(currentTournament => {
            if (!currentTournament || !currentTournament.currentMatchId) {
                setIsProcessing(false);
                resolve();
                return currentTournament;
            }
            
            setIsProcessing(true);
            const updatedTournament: TournamentState = JSON.parse(JSON.stringify(currentTournament));
            const { rounds, currentMatchId } = updatedTournament;
            
            let match: Match | undefined;
            for (const round of rounds) {
                const m = round.matches.find((m: Match) => m.id === currentMatchId);
                if (m) { match = m; break; }
            }

            if (!match || match.isBye || !match.pod1 || !match.pod2) {
                setIsProcessing(false);
                resolve();
                return updatedTournament;
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
            
            saveState(updatedTournament);

            if (winner) {
                const advancedState = advanceTournament(updatedTournament);
                setTimeout(() => {
                    setTournament(advancedState);
                    saveState(advancedState);
                    setIsProcessing(false);
                    resolve();
                }, isSimulation ? SIMULATION_DELAY_MS : POST_WINNER_DELAY_MS);
            } else {
                setTimeout(() => {
                    if(match) match.moves = undefined;
                    setTournament(t => ({...t!, ...updatedTournament}));
                    saveState(updatedTournament);
                    setIsProcessing(false);
                    resolve();
                }, isSimulation ? SIMULATION_DELAY_MS : 2000);
            }

            return updatedTournament;
        });
    });
  }, [advanceTournament]);
  
  const simulateTournament = useCallback(async () => {
    let localTournament = tournament;
    if (!localTournament || localTournament.winner) return;

    setIsProcessing(true);

    const runSimulationStep = async () => {
      // Find the current match from the latest state
      const currentMatchId = tournament?.currentMatchId;
      if (!currentMatchId) {
          setIsProcessing(false);
          return;
      }
      
      const pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
      const pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];
      
      await playMatch(pod1Move, pod2Move, true);

      // Recursive call in the next event loop cycle
      setTimeout(() => {
        // Need to check the winner status from the main state, not a local copy
        if (!winner) {
           runSimulationStep();
        } else {
           setIsProcessing(false);
        }
      }, 0);
    };

    runSimulationStep();
  }, [tournament, playMatch, winner]);


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
