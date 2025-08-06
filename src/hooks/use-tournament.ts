
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES, FINAL_BOSS } from '@/lib/constants';
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
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  };

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const numPods = initialPods.length;
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byesCount = nextPowerOfTwo - numPods;
    const firstRoundMatchesCount = (numPods - byesCount) / 2;
    const totalRounds = Math.log2(nextPowerOfTwo);

    let podsWithByes = initialPods.slice(0, byesCount);
    let podsInFirstRound = initialPods.slice(byesCount);

    let rounds: Round[] = [];
    let podsForCurrentRound: (Pod | null)[] = shuffleArray(podsInFirstRound);
    
    for(let i=0; i<totalRounds; i++) {
        const numMatchesInRound = (2 ** (totalRounds - 1)) / (2 ** i);
        rounds.push({
            id: i + 1,
            matches: Array.from({ length: numMatchesInRound }, (_, k) => ({
                id: `r${i + 1}-m${k}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                moveHistory: [],
            }))
        });
    }
    
    for(let i=0; i<firstRoundMatchesCount; i++) {
        rounds[0].matches[i].pod1 = podsForCurrentRound[i*2];
        rounds[0].matches[i].pod2 = podsForCurrentRound[i*2+1];
    }

    let byeMatchCounter = firstRoundMatchesCount;
    podsWithByes.forEach(pod => {
        rounds[0].matches[byeMatchCounter].pod1 = pod;
        rounds[0].matches[byeMatchCounter].isBye = true;
        rounds[0].matches[byeMatchCounter].winner = pod;
        byeMatchCounter++;
    });

    for (const match of rounds[0].matches) {
        if(match.isBye && match.winner) {
            advanceWinner(match, 0, rounds);
        }
    }
    
    const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

    return {
      pods: initialPods,
      rounds: rounds,
      currentMatchId: firstPlayableMatch?.id || null,
      winner: null,
      finalMatch: null,
      gameWinner: null,
    };
  };

  const advanceWinner = (match: Match, roundIndex: number, rounds: Round[]) => {
      if (roundIndex + 1 < rounds.length && match.winner) {
          const currentMatchIndex = rounds[roundIndex].matches.findIndex(m => m.id === match.id);
          const nextRoundIndex = roundIndex + 1;
          const nextMatchIndex = Math.floor(currentMatchIndex / 2);
          const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];

          if (currentMatchIndex % 2 === 0) {
              nextMatch.pod1 = match.winner;
          } else {
              nextMatch.pod2 = match.winner;
          }
      }
  }

  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    setIsProcessing(false);
  }, []);
  
  const advanceTournament = (currentState: TournamentState) => {
    let nextMatchId: string | null = null;
    
    for (const round of currentState.rounds) {
        for (const match of round.matches) {
            if (!match.winner && match.pod1 && match.pod2) {
                nextMatchId = match.id;
                break;
            }
        }
        if (nextMatchId) break;
    }

    const newState = { ...currentState, currentMatchId: nextMatchId };

    if (!nextMatchId) {
        const lastRound = currentState.rounds[currentState.rounds.length - 1];
        if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            newState.winner = lastRound.matches[0].winner;
            newState.finalMatch = {
                id: 'final-boss-match',
                pod1: newState.winner,
                pod2: { ...FINAL_BOSS, id: 999 },
                winner: null,
                loser: null,
                moveHistory: [],
            };
            newState.currentMatchId = 'final-boss-match';
        }
    }
    
    setTournament(newState);
    saveState(newState);
  };

  const playFinalMatch = (pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.finalMatch) return;
     
    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const match = updatedTournament.finalMatch;

    if (!match || !match.pod1 || !match.pod2) {
        setIsProcessing(false);
        return;
    }

    let winner: Pod | null = null;
    let winningMove: Move | null = null;

    if (pod1Move !== pod2Move) {
        if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
            (pod1Move === 'scissors' && pod2Move === 'paper') ||
            (pod1Move === 'paper' && pod2Move === 'rock')) {
            winner = match.pod1;
            winningMove = pod1Move;
        } else {
            winner = match.pod2;
            winningMove = pod2Move;
        }
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    setTournament(updatedTournament);

    setTimeout(() => {
        if (winner && winningMove) {
            match.winner = winner;
            updatedTournament.gameWinner = winner;
            const finalState = { ...updatedTournament, matchWinner: { winner, winningMove }};
            setTournament(finalState);
            saveState(finalState);
            setTimeout(() => {
                const stateAfterWinner = { ...finalState, matchWinner: null };
                setTournament(stateAfterWinner);
                saveState(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);
        } else {
            match.moves = undefined;
            setTournament({...updatedTournament});
            saveState(updatedTournament);
            setIsProcessing(false);
            toast({ title: "It's a draw!", description: "The boss is tough! Play again!" });
        }
    }, 1000);
  };

  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament) return;

    if (tournament.currentMatchId === 'final-boss-match') {
        playFinalMatch(pod1Move, pod2Move);
        return;
    }

    if (!tournament.currentMatchId) return;

    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    let roundIndex: number | undefined;

    for (let i = 0; i < rounds.length; i++) {
        const m = rounds[i].matches.find((m: Match) => m.id === currentMatchId);
        if (m) {
            match = m;
            roundIndex = i;
            break;
        }
    }

    if (!match || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let loser: Pod | null = null;
    let winningMove: Move | null = null;

    if (pod1Move !== pod2Move) {
      if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
          (pod1Move === 'scissors' && pod2Move === 'paper') ||
          (pod1Move === 'paper' && pod2Move === 'rock')) {
        winner = match.pod1;
        loser = match.pod2;
        winningMove = pod1Move;
      } else {
        winner = match.pod2;
        loser = match.pod1;
        winningMove = pod2Move;
      }
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

    setTournament(updatedTournament);

    setTimeout(() => {
        if (winner && winningMove) {
            match!.winner = winner;
            match!.loser = loser;
            
            const finalState = JSON.parse(JSON.stringify(updatedTournament));
            finalState.matchWinner = { winner, winningMove };

            setTournament(finalState);
            saveState(finalState);

            setTimeout(() => {
                const stateAfterWinner = { ...finalState, matchWinner: null };
                if (typeof roundIndex !== 'undefined') {
                    advanceWinner(match!, roundIndex, stateAfterWinner.rounds);
                }
                advanceTournament(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);

        } else { 
            match!.moves = undefined;
            const drawState = JSON.parse(JSON.stringify(updatedTournament));
            setTournament(drawState);
            saveState(drawState);
            setIsProcessing(false);
            toast({ title: "It's a draw!", description: "Play again to decide the winner." });
        }
    }, 1000);


  }, [tournament, toast]);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
  }, []);
  
  const simulateTournament = useCallback(async () => {
    if (!tournament) return;
    setIsProcessing(true);

    let simTournament = JSON.parse(JSON.stringify(tournament));

    while(!simTournament.winner) {
        const currentMatchId = simTournament.currentMatchId;
        if (!currentMatchId) break;

        let match: Match | undefined;
        let roundIndex: number = -1;
        for (let i = 0; i < simTournament.rounds.length; i++) {
            const m = simTournament.rounds[i].matches.find((m: Match) => m.id === currentMatchId);
            if (m) {
                match = m;
                roundIndex = i;
                break;
            }
        }

        if (!match || !match.pod1 || !match.pod2) break;

        let pod1Move, pod2Move, winner;
        do {
            pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
            pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];
            
            if (pod1Move === pod2Move) {
                winner = null;
            } else if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
                       (pod1Move === 'scissors' && pod2Move === 'paper') ||
                       (pod1Move === 'paper' && pod2Move === 'rock')) {
                winner = match.pod1;
            } else {
                winner = match.pod2;
            }
        } while(!winner);
        
        match.winner = winner;
        match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
        match.moves = { pod1: pod1Move, pod2: pod2Move };
        match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

        advanceWinner(match, roundIndex, simTournament.rounds);

        let nextMatchId: string | null = null;
        for (const r of simTournament.rounds) {
            for (const m of r.matches) {
                if (!m.winner && m.pod1 && m.pod2) {
                    nextMatchId = m.id;
                    break;
                }
            }
            if (nextMatchId) break;
        }
        simTournament.currentMatchId = nextMatchId;

        if (!nextMatchId) {
            const lastRound = simTournament.rounds[simTournament.rounds.length - 1];
            if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
                simTournament.winner = lastRound.matches[0].winner;
            }
        }
        
        // This visual update is very fast, so batching them up
        // by removing the state update from the loop.
    }
    
    // One final update to show the final state before the boss
    setTournament({ ...simTournament });
    
    // Now trigger the final boss setup
    if (simTournament.winner) {
        simTournament.finalMatch = {
            id: 'final-boss-match',
            pod1: simTournament.winner,
            pod2: { ...FINAL_BOSS, id: 999 },
            winner: null,
            loser: null,
            moveHistory: [],
        };
        simTournament.currentMatchId = 'final-boss-match';
    }

    setTournament(simTournament);
    saveState(simTournament);
    setIsProcessing(false);
  }, [tournament]);

  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          parsedState.matchWinner = null; 
          setTournament(parsedState);
        }
      } catch (error) {
        console.error("Could not load state from localStorage", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    };
    loadState();
  }, []);

  const currentMatch = tournament && tournament.currentMatchId
    ? tournament.currentMatchId === 'final-boss-match'
        ? tournament.finalMatch
        : tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId
    ? tournament.currentMatchId === 'final-boss-match'
        ? 0 // Special value for final boss
        : tournament.rounds.findIndex(r => r.matches.some(m => m.id === tournament.currentMatchId)) + 1
    : null;

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    simulateTournament,
    currentMatch,
    winner: tournament?.winner ?? null,
    matchWinner: tournament?.matchWinner,
    gameWinner: tournament?.gameWinner ?? null,
isProcessing,
    currentRound
  };
}

    