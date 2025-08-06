
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES, FINAL_BOSS } from '@/lib/constants';
import type { TournamentState, Pod, Match, Move, Standing } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { shuffleArray } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'rps-pod-showdown-tournament';

export function useTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const saveState = (state: TournamentState | null) => {
    try {
      if (typeof window !== 'undefined') {
        if (state) {
          const stateString = JSON.stringify(state);
          localStorage.setItem(LOCAL_STORAGE_KEY, stateString);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  };

  const createRoundRobinSchedule = (pods: Pod[]): TournamentState => {
    const schedule: Match[] = [];
    let matchCount = 0;
    for (let i = 0; i < pods.length; i++) {
        for (let j = i + 1; j < pods.length; j++) {
            schedule.push({
                id: `m-${matchCount++}`,
                pod1: pods[i],
                pod2: pods[j],
                winner: null,
                loser: null,
                played: false,
                moveHistory: [],
            });
        }
    }

    const shuffledSchedule = shuffleArray(schedule);

    const standings: Standing[] = pods.map(pod => ({
        podId: pod.id,
        name: pod.name,
        emoji: pod.emoji,
        wins: 0,
        losses: 0,
        draws: 0,
        gamesPlayed: 0
    }));

    return {
        pods: pods,
        schedule: shuffledSchedule,
        standings: standings,
        currentMatchId: shuffledSchedule[0]?.id || null,
        winner: null,
        finalMatch: null,
        gameWinner: null,
    };
  };

  const startTournament = useCallback(() => {
    setIsProcessing(true);
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createRoundRobinSchedule(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
    setIsProcessing(false);
  }, []);

  const advanceTournament = (currentState: TournamentState) => {
    const nextMatch = currentState.schedule.find(m => !m.played);

    if (nextMatch) {
      currentState.currentMatchId = nextMatch.id;
    } else {
      // All matches played, determine winner
      currentState.currentMatchId = null;
      
      const sortedStandings = [...currentState.standings].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      });

      const topPod = sortedStandings[0];
      const winner = currentState.pods.find(p => p.id === topPod.podId) || null;
      currentState.winner = winner;
      
      if (winner) {
         // Delay setting up final boss match to show winner screen
         setTimeout(() => {
            const finalState = JSON.parse(JSON.stringify(currentState));
            finalState.finalMatch = {
                id: 'final-boss-match',
                pod1: finalState.winner,
                pod2: { ...FINAL_BOSS, id: 999 },
                winner: null,
                loser: null,
                played: false,
                moveHistory: [],
            };
            finalState.currentMatchId = 'final-boss-match';
            setTournament(finalState);
            saveState(finalState);
        }, 4000); // 4 second delay
      }
    }
    
    setTournament({ ...currentState });
    saveState(currentState);
  };
  
  const updateStandings = (currentState: TournamentState, match: Match) => {
    if (!match.pod1 || !match.pod2) return;

    const pod1Standing = currentState.standings.find(s => s.podId === match.pod1!.id);
    const pod2Standing = currentState.standings.find(s => s.podId === match.pod2!.id);

    if (!pod1Standing || !pod2Standing) return;
    
    pod1Standing.gamesPlayed++;
    pod2Standing.gamesPlayed++;

    if (match.isDraw) {
        pod1Standing.draws++;
        pod2Standing.draws++;
    } else if (match.winner) {
        if (match.winner.id === pod1Standing.podId) {
            pod1Standing.wins++;
            pod2Standing.losses++;
        } else {
            pod2Standing.wins++;
            pod1Standing.losses++;
        }
    }
  }
  
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
    if (!tournament || !tournament.currentMatchId) return;

    if (tournament.currentMatchId === 'final-boss-match') {
        playFinalMatch(pod1Move, pod2Move);
        return;
    }

    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const match = updatedTournament.schedule.find(m => m.id === updatedTournament.currentMatchId);

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
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];

    setTournament(updatedTournament);

    setTimeout(() => {
        match.played = true;
        if (winner && winningMove) {
            match.winner = winner;
            match.loser = winner.id === match.pod1!.id ? match.pod2 : match.pod1;
            
            updateStandings(updatedTournament, match);

            const finalState = { ...updatedTournament, matchWinner: { winner, winningMove } };
            setTournament(finalState);
            saveState(finalState);

            setTimeout(() => {
                const stateAfterWinner = { ...finalState, matchWinner: null };
                advanceTournament(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);

        } else { 
            match.isDraw = true;
            updateStandings(updatedTournament, match);

            const drawState = {...updatedTournament, matchWinner: { isDraw: true }};
            setTournament(drawState);
            saveState(drawState);
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                const resetState = {...drawState, matchWinner: null};
                advanceTournament(resetState);
                setIsProcessing(false);
            }, 2000);
        }
    }, 1000);

  }, [tournament]);
  
  const simulateTournament = useCallback(async () => {
    if (!tournament) return;
    setIsProcessing(true);

    let simTournament = JSON.parse(JSON.stringify(tournament));

    simTournament.schedule.forEach((match: Match) => {
        if (!match.played && match.pod1 && match.pod2) {
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
            } while(!winner); // Reroll on draws for simulation simplicity
            
            match.winner = winner;
            match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
            match.moves = { pod1: pod1Move, pod2: pod2Move };
            match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];
            match.played = true;

            updateStandings(simTournament, match);
        }
    });

    advanceTournament(simTournament);
    
    // The advanceTournament function is now async with the final boss setup,
    // so we can set processing to false here.
    setIsProcessing(false);

  }, [tournament]);


  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
  }, []);

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
        : tournament.schedule.find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId && currentMatch?.pod1 && tournament.standings
    ? (tournament.standings.find(s => s.podId === currentMatch.pod1!.id)?.gamesPlayed ?? 0) + 1
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
