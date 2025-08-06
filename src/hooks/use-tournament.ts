
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
    const numPods = pods.length;
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byesCount = nextPowerOfTwo - numPods;
    const numRounds = Math.log2(nextPowerOfTwo);
    
    let rounds: Round[] = [];
    
    // Round 1
    const round1: Round = { id: 1, matches: [] };
    const podsWithByes = pods.slice(0, byesCount);
    const podsInFirstRound = pods.slice(byesCount);

    // Add byes as played matches, winners advance
    podsWithByes.forEach((pod, index) => {
      round1.matches.push({
        id: `r1-b${index}`,
        pod1: pod,
        pod2: null,
        winner: pod,
        loser: null,
        isBye: true,
        moveHistory: [],
      });
    });

    // Add first round matches
    for (let i = 0; i < podsInFirstRound.length; i += 2) {
      round1.matches.push({
        id: `r1-m${i/2}`,
        pod1: podsInFirstRound[i],
        pod2: podsInFirstRound[i + 1],
        winner: null,
        loser: null,
        moveHistory: [],
      });
    }
    rounds.push(round1);

    // Create subsequent empty rounds and populate them
    let lastRoundMatches = round1.matches;
    for (let i = 2; i <= numRounds; i++) {
        const currentRoundMatches: Match[] = [];
        const winnersFromLastRound = lastRoundMatches.map(m => m.winner);

        for (let j = 0; j < winnersFromLastRound.length; j += 2) {
            currentRoundMatches.push({
                id: `r${i}-m${j/2}`,
                pod1: winnersFromLastRound[j],
                pod2: winnersFromLastRound[j+1],
                winner: null,
                loser: null,
                moveHistory: [],
            });
        }
        rounds.push({ id: i, matches: currentRoundMatches });
        lastRoundMatches = currentRoundMatches;
    }


    const firstPlayableMatch = rounds.flatMap(r => r.matches).find(m => !m.isBye && !m.winner && m.pod1 && m.pod2);

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
    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    if (currentMatchId) {
        for (let i = 0; i < rounds.length; i++) {
            const matchIndex = rounds[i].matches.findIndex(m => m.id === currentMatchId);
            if (matchIndex !== -1) {
                currentRoundIndex = i;
                currentMatchIndex = matchIndex;
                break;
            }
        }
    }

    if (currentRoundIndex === -1 || currentMatchIndex === -1) {
        return;
    }
    
    const winner = rounds[currentRoundIndex].matches[currentMatchIndex].winner;

    // Advance winner to the next round
    const nextRoundIndex = currentRoundIndex + 1;
    if (winner && nextRoundIndex < rounds.length) {
        const overallMatchIndex = rounds[currentRoundIndex].matches.findIndex(m => m.id === currentMatchId);
        
        const nextMatchIndex = Math.floor(overallMatchIndex / 2);
        const targetMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
        
        if (targetMatch) {
            if (overallMatchIndex % 2 === 0) {
                targetMatch.pod1 = winner;
            } else {
                targetMatch.pod2 = winner;
            }
        }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    for (const round of rounds) {
        const nextPlayableMatch = round.matches.find(m => !m.isBye && !m.winner && m.pod1 && m.pod2);
        if (nextPlayableMatch) {
            nextMatchId = nextPlayableMatch.id;
            break;
        }
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
      const m = round.matches.find((m: Match) => m.id === currentMatchId);
      if (m) {
        match = m;
        break;
      }
    }

    if (!match || !match.pod1 || !match.pod2) {
      setIsProcessing(false);
      return;
    }

    let winner: Pod | null = null;
    let winningMove: Move | null = null;
    let loser: Pod | null = null;
    let isDraw = false;

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
    } else {
        isDraw = true;
    }

    match.moves = { pod1: pod1Move, pod2: pod2Move };
    match.moveHistory = [...(match.moveHistory || []), { pod1: pod1Move, pod2: pod2Move }];
    match.isDraw = isDraw;

    setTournament({ ...updatedTournament });
    
    setTimeout(() => {
        if (winner) {
            match!.winner = winner;
            match!.loser = loser;
            match!.isDraw = false;
            advanceTournament(updatedTournament);
            setIsProcessing(false);

        } else { // It's a draw
            match!.moves = undefined;
            match!.isDraw = false;
            const resetState = {...updatedTournament};
            setTournament(resetState);
            saveState(resetState);
            setIsProcessing(false);
            toast({
                title: "It's a Draw!",
                description: "The match was a draw. Play again!",
            });
        }
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
