
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS, MOVES } from '@/lib/constants';
import type { TournamentState, Pod, Match, Move, Round } from '@/lib/types';
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

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    const numPods = shuffledPods.length;
    const nextPowerOfTwo = 2 ** Math.ceil(Math.log2(numPods));
    const byesCount = nextPowerOfTwo - numPods;
    const firstRoundMatchesCount = (numPods - byesCount) / 2;
    const totalRounds = Math.log2(nextPowerOfTwo);
    
    let rounds: Round[] = [];
    const podsWithByes = shuffledPods.slice(0, byesCount);
    const podsInFirstRound = shuffledPods.slice(byesCount);

    // Round 1
    const round1: Round = { id: 1, matches: [] };
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
    let numMatchesInPreviousRound = firstRoundMatchesCount;
    for (let i = 2; i <= totalRounds; i++) {
        const numMatchesInCurrentRound = (numMatchesInPreviousRound + (i === 2 ? byesCount : 0)) / 2;
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

    // Pre-populate Round 2 with bye winners
    if (byesCount > 0) {
        podsWithByes.forEach((pod, index) => {
            const matchIndex = Math.floor(index / 2);
            if (index % 2 === 0) {
                rounds[1].matches[matchIndex].pod1 = pod;
            } else {
                rounds[1].matches[matchIndex].pod2 = pod;
            }
        });
    }

    const firstPlayableMatch = rounds[0].matches.find(m => !m.isBye && m.pod1 && m.pod2);

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
        const byesCount = (2 ** Math.ceil(Math.log2(currentState.pods.length))) - currentState.pods.length;
        
        // This logic correctly maps the winner of a match in round N
        // to their slot in round N+1
        let overallMatchIndex = currentMatchIndex;
        if (currentRoundIndex > 0) {
            // For rounds after the first, we need to account for matches in previous rounds
            for (let i = 0; i < currentRoundIndex; i++) {
                overallMatchIndex += currentState.rounds[i].matches.length;
            }
        } else {
            // For the first round, we must account for byes
            overallMatchIndex += byesCount;
        }

        const nextMatchIndex = Math.floor(overallMatchIndex / 2);
        
        const nextMatchAbsoluteIndex = nextMatchIndex - (currentRoundIndex > 0 ? 0 : Math.ceil(byesCount/2));
        
        let targetMatch: Match | undefined;

        if (currentRoundIndex === 0) {
          // If we are in round 1, we find the match in round 2
           targetMatch = rounds[nextRoundIndex].matches[currentMatchIndex + Math.ceil(byesCount / 2)]
           const matchSlotIndexInNextRound = Math.floor(currentMatchIndex / 2);
           targetMatch = rounds[nextRoundIndex].matches[matchSlotIndexInNextRound];
        } else {
            const matchSlotIndexInNextRound = Math.floor(currentMatchIndex / 2);
            targetMatch = rounds[nextRoundIndex].matches[matchSlotIndexInNextRound];
        }
        
         if (targetMatch) {
            if (currentMatchIndex % 2 === 0) {
                targetMatch.pod1 = winner;
            } else {
                targetMatch.pod2 = winner;
            }
        }
    }

    // Find next match to play
    let nextMatchId: string | null = null;
    for (const round of rounds) {
        const nextPlayableMatch = round.matches.find(m => !m.played && m.pod1 && m.pod2);
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

            // This logic moves winners from round 1 to round 2
            if(roundIndex === 0) {
                const byesCount = (2 ** Math.ceil(Math.log2(updatedTournament.pods.length))) - updatedTournament.pods.length;
                const matchIndexInRound = rounds[0].matches.findIndex(m => m.id === currentMatchId);
                const targetMatchIndex = Math.floor(matchIndexInRound/2) + (byesCount);
                
                const targetMatchInNextRound = rounds[1].matches[Math.floor(matchIndexInRound / 2)];
                if (matchIndexInRound % 2 === 0) {
                    targetMatchInNextRound.pod1 = winner;
                } else {
                    targetMatchInNextRound.pod2 = winner;
                }
            }


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
