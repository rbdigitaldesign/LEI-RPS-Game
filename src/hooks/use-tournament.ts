
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS } from '@/lib/constants';
import type { TournamentState, Pod, Round, Match, Move } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const pods = [...initialPods];
    const rounds: Round[] = [
        { id: 1, name: 'Round 1', matches: [] },
        { id: 2, name: 'Quarter-Finals', matches: [] },
        { id: 3, name: 'Semi-Finals', matches: [] },
        { id: 4, name: 'Final', matches: [] },
    ];

    // Round 1: 7 matches
    for (let i = 0; i < 7; i++) {
        rounds[0].matches.push({
            id: `r1-m${i}`,
            pod1: pods[i * 2],
            pod2: pods[i * 2 + 1],
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }

    // Round 2: 3 matches (one winner from R1 gets a pass)
    for (let i = 0; i < 3; i++) {
        rounds[1].matches.push({
            id: `r2-m${i}`,
            pod1: null,
            pod2: null,
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }

    // Round 3: 2 matches
    for (let i = 0; i < 2; i++) {
        rounds[2].matches.push({
            id: `r3-m${i}`,
            pod1: null,
            pod2: null,
            winner: null,
            loser: null,
            moveHistory: [],
        });
    }
    
    // Round 4: 1 match
    rounds[3].matches.push({
        id: 'r4-m0',
        pod1: null,
        pod2: null,
        winner: null,
        loser: null,
        moveHistory: [],
    });

    const firstPlayableMatch = rounds[0].matches[0];

    return {
      pods: initialPods,
      rounds: rounds,
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
    const { rounds, currentMatchId } = currentState;
    if (!currentMatchId) return;

    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    for (let i = 0; i < rounds.length; i++) {
      const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
      if (matchIndex !== -1) {
        currentRoundIndex = i;
        currentMatchIndex = matchIndex;
        break;
      }
    }
    
    if (currentRoundIndex === -1) return;

    const winner = rounds[currentRoundIndex].matches[currentMatchIndex].winner;
    const nextRoundIndex = currentRoundIndex + 1;

    if (winner && nextRoundIndex < rounds.length) {
      if (currentRoundIndex === 0) { // From Round 1 to Quarter-Finals
        const round1Winners = rounds[0].matches.filter(m => m.winner).map(m => m.winner);
        
        if (round1Winners.length === 7) {
            // First winner gets a pass to semis
            const semiFinalist = round1Winners[0];
            const semiFinalMatch = rounds[2].matches[0];
            if (semiFinalMatch) semiFinalMatch.pod1 = semiFinalist;

            const remainingWinners = round1Winners.slice(1); // 6 pods remain
            for(let i=0; i<3; i++) {
                const qfMatch = rounds[1].matches[i];
                if(qfMatch) {
                    qfMatch.pod1 = remainingWinners[i*2];
                    qfMatch.pod2 = remainingWinners[i*2+1];
                }
            }
        }
      } else { // Generic progression for other rounds
        const targetMatchIndex = Math.floor(currentMatchIndex / 2);
        const targetMatch = rounds[nextRoundIndex].matches[targetMatchIndex];
        if (targetMatch) {
          if (!targetMatch.pod1) {
            targetMatch.pod1 = winner;
          } else {
            targetMatch.pod2 = winner;
          }
        }
      }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    for (const round of rounds) {
      for (const match of round.matches) {
        if (!match.winner && match.pod1 && match.pod2) {
          nextMatchId = match.id;
          break;
        }
      }
      if (nextMatchId) break;
    }
    
    currentState.currentMatchId = nextMatchId;

    if (!nextMatchId) {
      const lastRound = rounds[rounds.length - 1];
      if (lastRound.matches.length === 1 && lastRound.matches[0].winner) {
        currentState.winner = lastRound.matches[0].winner;
      }
    }
    
    setTournament({ ...currentState });
    saveState(currentState);
  };
    
  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.currentMatchId) return;

    setIsProcessing(true);
    
    const updatedTournament: TournamentState = JSON.parse(JSON.stringify(tournament));
    const { rounds, currentMatchId } = updatedTournament;
    
    let match: Match | undefined;
    for (const round of rounds) {
      match = round.matches.find(m => m.id === currentMatchId);
      if (match) break;
    }

    if (!match || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let loser: Pod | null = null;
    let isDraw = false;

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
    } else {
        isDraw = true;
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];
    match.isDraw = isDraw;

    if (winner) {
        match.winner = winner;
        match.loser = loser;
        match.isDraw = false;
    }
    
    setTournament({ ...updatedTournament }); // Reveal move
    
    setTimeout(() => {
        if (winner) {
            advanceTournament(updatedTournament);
        } else { // It's a draw, so reset for rematch
            match!.moves = undefined;
            match!.isDraw = false;
            toast({
                title: "It's a Draw!",
                description: "The match was a draw. Play again!",
            });
        }
        setTournament({...updatedTournament});
        saveState(updatedTournament);
        setIsProcessing(false);
    }, 2000);

  }, [tournament, toast]);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
  }, []);

  useEffect(() => {
    const loadState = () => {
      try {
        if (typeof window === 'undefined') return;
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
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
    ? tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && currentMatch
    ? tournament.rounds.find(r => r.matches.some(m => m.id === currentMatch.id))?.id ?? null
    : null;

  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner: tournament?.winner ?? null,
    isProcessing,
    currentRound
  };
}
