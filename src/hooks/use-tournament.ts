
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
    const firstRoundMatchesCount = (numPods - byesCount) / 2;
    const totalRounds = Math.log2(nextPowerOfTwo);
    
    let rounds: Round[] = [];
    const podsWithByes = pods.slice(0, byesCount);
    const podsInFirstRound = pods.slice(byesCount);

    // Round 1
    const round1: Round = { id: 1, matches: [] };
    // Add byes as played matches
     podsWithByes.forEach((pod, index) => {
        round1.matches.push({
            id: `r1-b${index}`,
            pod1: pod,
            pod2: null,
            winner: pod,
            loser: null,
            played: true,
            isBye: true,
            moveHistory: [],
        });
    });

    for (let i = 0; i < firstRoundMatchesCount; i++) {
        round1.matches.push({
            id: `r1-m${i}`,
            pod1: podsInFirstRound[i * 2],
            pod2: podsInFirstRound[i * 2 + 1],
            winner: null,
            loser: null,
            played: false,
            moveHistory: [],
        });
    }
    rounds.push(round1);

    // Subsequent rounds
    let numMatchesInPreviousRound = round1.matches.length;
    for (let i = 2; i <= totalRounds; i++) {
        const numMatchesInCurrentRound = numMatchesInPreviousRound / 2;
        const round: Round = { id: i, matches: [] };
        for (let j = 0; j < numMatchesInCurrentRound; j++) {
            round.matches.push({
                id: `r${i}-m${j}`,
                pod1: null,
                pod2: null,
                winner: null,
                loser: null,
                played: false,
                moveHistory: [],
            });
        }
        rounds.push(round);
        numMatchesInPreviousRound = numMatchesInCurrentRound;
    }

    // Populate next round with winners from the first round
    const winnersFromRound1 = round1.matches.map(m => m.winner);
    for(let i=0; i<winnersFromRound1.length; i++) {
        const winner = winnersFromRound1[i];
        if (winner) {
            const nextMatchIndex = Math.floor(i / 2);
            if (i % 2 === 0) {
                rounds[1].matches[nextMatchIndex].pod1 = winner;
            } else {
                rounds[1].matches[nextMatchIndex].pod2 = winner;
            }
        }
    }


    const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && !m.played && m.pod1 && m.pod2);

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
       
        let overallPlayedMatchesInRound = 0;
        for(let i=0; i<rounds[currentRoundIndex].matches.length; i++) {
            if (rounds[currentRoundIndex].matches[i].played) {
                 overallPlayedMatchesInRound++;
            }
             if (rounds[currentRoundIndex].matches[i].id === currentMatchId) {
                break;
            }
        }
        
        const previousRoundWinners = rounds[currentRoundIndex].matches.filter(m => m.winner).map(m => m.winner);
        const winnerIndex = previousRoundWinners.findIndex(p => p?.id === winner.id);


        const nextMatchIndex = Math.floor(winnerIndex / 2);
        
        const targetMatch = rounds[nextRoundIndex].matches[nextMatchIndex];
        
         if (targetMatch) {
            if (!targetMatch.pod1) {
                targetMatch.pod1 = winner;
            } else if (!targetMatch.pod2) {
                targetMatch.pod2 = winner;
            }
        }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    for (const round of rounds) {
        const nextPlayableMatch = round.matches.find(m => !m.played && !m.isBye && m.pod1 && m.pod2);
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
    let roundIndex = -1;
    
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
    let winningMove: Move | null = null;
    let loser: Pod | null = null;

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
    
    const revealState = {...updatedTournament, matchWinner: winner ? { winner, winningMove } : { isDraw: true }};
    setTournament(revealState);

    setTimeout(() => {
        if (winner) {
            match.played = true;
            match.winner = winner;
            match.loser = loser;

            setTimeout(() => {
                const stateAfterWinner = { ...updatedTournament, matchWinner: null };
                advanceTournament(stateAfterWinner);
                setIsProcessing(false);
            }, 3000);

        } else { 
            match.isDraw = true;
            
            setTimeout(() => {
                match.moves = undefined;
                match.isDraw = false;
                const resetState = {...updatedTournament, matchWinner: null};
                setTournament(resetState);
                saveState(resetState);
                setIsProcessing(false);
            }, 2000);
        }
    }, 1000);

  }, [tournament]);

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
          // Clear transient state on load
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
    ? tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && currentMatch
    ? tournament.rounds.findIndex(r => r.matches.some(m => m.id === currentMatch.id)) + 1
    : null;


  return {
    tournament,
    startTournament,
    resetTournament,
    playMatch,
    currentMatch,
    winner: tournament?.winner ?? null,
    matchWinner: tournament?.matchWinner,
    isProcessing,
    currentRound
  };
}
