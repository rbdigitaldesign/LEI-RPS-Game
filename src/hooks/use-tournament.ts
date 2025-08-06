
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

  const advanceWinner = (match: Match, roundIndex: number, rounds: Round[]) => {
      if (roundIndex + 1 < rounds.length && match.winner) {
          const currentMatchIndex = rounds[roundIndex].matches.findIndex(m => m.id === match.id);
          const nextRoundIndex = roundIndex + 1;
          const nextMatchIndex = Math.floor(currentMatchIndex / 2);
          
          if(nextMatchIndex < rounds[nextRoundIndex].matches.length) {
            const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
            if (currentMatchIndex % 2 === 0) {
                nextMatch.pod1 = match.winner;
            } else {
                nextMatch.pod2 = match.winner;
            }
          }
      }
  }

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    const numPods = shuffledPods.length;
    
    // For 14 pods, we need a 16-slot bracket.
    const bracketSize = 16;
    const totalRounds = Math.log2(bracketSize); // 4 rounds for 16 slots
    
    // Number of byes (pods that skip round 1)
    const numByes = bracketSize - numPods; // 16 - 14 = 2 byes
    
    // Number of matches in the first round (play-in round)
    const numPlayInMatches = (numPods - numByes) / 2; // (14 - 2) / 2 = 6 matches
    
    // Pods that get a bye to the second round
    const byePods = shuffledPods.slice(0, numByes);
    // Pods that will participate in the play-in round
    const playInPods = shuffledPods.slice(numByes);


    let rounds: Round[] = [];
    // Create all rounds with empty matches
    for (let i = 0; i < totalRounds; i++) {
        const numMatchesInRound = (2 ** (totalRounds - (i + 1)));
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

    // Populate the first round with play-in matches
    let playInMatchIndex = 0;
    for (let i = 0; i < playInPods.length; i += 2) {
        rounds[0].matches[playInMatchIndex].pod1 = playInPods[i];
        rounds[0].matches[playInMatchIndex].pod2 = playInPods[i + 1];
        playInMatchIndex++;
    }
    
    // The remaining matches in the first round are technically byes for the second-round pods.
    // We'll mark them as such and pre-populate the second round.
    let byeMatchIndex = 0;
    for (let i = numPlayInMatches; i < rounds[0].matches.length; i++) {
        const byePod = byePods[byeMatchIndex];
        rounds[0].matches[i].isBye = true;
        rounds[0].matches[i].pod1 = byePod;
        rounds[0].matches[i].winner = byePod;
        
        // Directly advance the bye pod to the second round
        advanceWinner(rounds[0].matches[i], 0, rounds);
        byeMatchIndex++;
    }
    
    const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye);

    return {
      pods: initialPods,
      rounds: rounds,
      currentMatchId: firstPlayableMatch?.id || null,
      winner: null,
      finalMatch: null,
      gameWinner: null,
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
    let nextMatchId: string | null = null;
    
    // Find the next playable match
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
             // Delay setting up final boss match to show winner screen
            setTimeout(() => {
                const finalState = JSON.parse(JSON.stringify(newState));
                finalState.finalMatch = {
                    id: 'final-boss-match',
                    pod1: finalState.winner,
                    pod2: { ...FINAL_BOSS, id: 999 },
                    winner: null,
                    loser: null,
                    moveHistory: [],
                };
                finalState.currentMatchId = 'final-boss-match';
                setTournament(finalState);
                saveState(finalState);
            }, 4000); // 4 second delay
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
            match.isDraw = true;
            const drawState = {...updatedTournament, matchWinner: { isDraw: true }};
            setTournament(drawState);
            saveState(drawState);
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                const resetState = {...drawState, matchWinner: null};
                setTournament(resetState);
                saveState(resetState);
                setIsProcessing(false);
            }, 2000);
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
            match!.isDraw = true;
            const drawState = {...JSON.parse(JSON.stringify(updatedTournament)), matchWinner: { isDraw: true }};
            setTournament(drawState);
            saveState(drawState);
            
            setTimeout(() => {
                match!.moves = undefined;
                match!.isDraw = false;
                const resetState = {...drawState, matchWinner: null};
                setTournament(resetState);
                saveState(resetState);
                setIsProcessing(false);
            }, 2000);
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

    // Simulate all rounds
    while(simTournament.currentMatchId) {
        let currentMatch: Match | undefined;
        let currentRoundIndex: number = -1;

        for (let i = 0; i < simTournament.rounds.length; i++) {
            const match = simTournament.rounds[i].matches.find((m: Match) => m.id === simTournament.currentMatchId);
            if (match) {
                currentMatch = match;
                currentRoundIndex = i;
                break;
            }
        }
        
        if (currentMatch && !currentMatch.isBye && currentMatch.pod1 && currentMatch.pod2) {
            let pod1Move, pod2Move, winner;
            do {
                pod1Move = MOVES[Math.floor(Math.random() * MOVES.length)];
                pod2Move = MOVES[Math.floor(Math.random() * MOVES.length)];
                
                if (pod1Move === pod2Move) {
                    winner = null;
                } else if ((pod1Move === 'rock' && pod2Move === 'scissors') ||
                           (pod1Move === 'scissors' && pod2Move === 'paper') ||
                           (pod1Move === 'paper' && pod2Move === 'rock')) {
                    winner = currentMatch.pod1;
                } else {
                    winner = currentMatch.pod2;
                }
            } while(!winner);
            
            currentMatch.winner = winner;
            currentMatch.loser = winner.id === currentMatch.pod1.id ? currentMatch.pod2 : currentMatch.pod1;
            currentMatch.moves = { pod1: pod1Move, pod2: pod2Move };
            currentMatch.moveHistory = [...(currentMatch.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

            advanceWinner(currentMatch, currentRoundIndex, simTournament.rounds);

            let nextMatchId: string | null = null;
            for (const round of simTournament.rounds) {
                for (const match of round.matches) {
                    if (!match.winner && match.pod1 && match.pod2) {
                        nextMatchId = match.id;
                        break;
                    }
                }
                if (nextMatchId) break;
            }
            simTournament.currentMatchId = nextMatchId;

        } else {
            // Should not happen in a well-formed bracket, but as a safeguard
            simTournament.currentMatchId = null;
        }
    }


    const lastRound = simTournament.rounds[simTournament.rounds.length - 1];
    if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
        simTournament.winner = lastRound.matches[0].winner;
    }
    
    simTournament.currentMatchId = null; // Simulation done
    setTournament(simTournament);
    saveState(simTournament);
    
    // Now handle the final boss setup
     if (simTournament.winner) {
        setTimeout(() => {
            const finalState = JSON.parse(JSON.stringify(simTournament));
            finalState.finalMatch = {
                id: 'final-boss-match',
                pod1: finalState.winner,
                pod2: { ...FINAL_BOSS, id: 999 },
                winner: null,
                loser: null,
                moveHistory: [],
            };
            finalState.currentMatchId = 'final-boss-match';
            setTournament(finalState);
            saveState(finalState);
            setIsProcessing(false);
        }, 4000); // Wait for the winner announcement
    } else {
        setIsProcessing(false);
    }

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
