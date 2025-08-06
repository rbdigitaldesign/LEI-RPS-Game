
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS } from '@/lib/constants';
import type { TournamentState, Pod, Round, Match, Move } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { shuffle } from '@/lib/utils';

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
    const shuffledPods = shuffle(initialPods);
    const rounds: Round[] = [];
    const numPods = shuffledPods.length;
    const numRounds = Math.ceil(Math.log2(numPods));

    let currentPods = [...shuffledPods];
    const roundNames = ['Round 1', 'Quarter-Finals', 'Semi-Finals', 'Final', 'Champion'];

    for (let i = 0; i < numRounds; i++) {
        const round: Round = {
            id: i + 1,
            name: roundNames[i] || `Round ${i + 1}`,
            matches: [],
        };
        const numMatches = currentPods.length / 2;
        for (let j = 0; j < numMatches; j++) {
            round.matches.push({
                id: `r${i + 1}-m${j}`,
                pod1: currentPods[j * 2],
                pod2: currentPods[j * 2 + 1],
                winner: null,
                loser: null,
                moveHistory: [],
            });
        }
        rounds.push(round);
        currentPods = new Array(numMatches).fill(null);
    }

    const firstPlayableMatch = rounds[0]?.matches[0];

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
        const nextMatchIndex = Math.floor(currentMatchIndex / 2);
        const nextMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
        if (nextMatch) {
            if (currentMatchIndex % 2 === 0) {
                nextMatch.pod1 = winner;
            } else {
                nextMatch.pod2 = winner;
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
