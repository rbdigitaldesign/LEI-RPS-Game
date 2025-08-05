'use client';

import { useState, useEffect, useCallback } from 'react';
import { PODS } from '@/lib/constants';
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
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save state to localStorage", error);
    }
  };

  const createBracket = (initialPods: Pod[]): TournamentState => {
    const shuffledPods = shuffleArray(initialPods);
    const rounds: Round[] = [];
    let currentPods = shuffledPods;
    let roundNum = 1;

    while (currentPods.length > 1) {
      const matches: Match[] = [];
      for (let i = 0; i < currentPods.length; i += 2) {
        if (currentPods[i + 1]) {
          matches.push({
            id: `r${roundNum}-m${i / 2}`,
            pod1: currentPods[i],
            pod2: currentPods[i + 1],
            winner: null,
            loser: null,
          });
        } else {
          // This pod gets a bye
          matches.push({
            id: `r${roundNum}-m${i / 2}`,
            pod1: currentPods[i],
            pod2: currentPods[i], // Bye pod immediately wins
            winner: currentPods[i],
            loser: null,
          });
        }
      }
      rounds.push({ id: roundNum, matches });
      currentPods = rounds[rounds.length - 1].matches.map(m => m.winner).filter(Boolean) as Pod[];
      roundNum++;
    }
    
    // Reset winners for actual play
    const finalRounds = JSON.parse(JSON.stringify(rounds)).map((r: Round) => ({
        ...r,
        matches: r.matches.map((m: Match) => {
            // Unset winner if it was a bye match that needs to be played
            if (m.pod2 && m.pod1.id === m.pod2.id) {
               m.winner = m.pod1; // This is a true bye, winner is set
               m.loser = null;
            } else {
               m.winner = null; // regular match
               m.loser = null;
            }
            return m;
        })
    }));


    return {
      pods: initialPods,
      rounds: finalRounds,
      currentMatchId: finalRounds[0]?.matches[0]?.id || null,
      winner: null,
    };
  };

  const startTournament = useCallback(() => {
    const initialPods = PODS.map((p, i) => ({ ...p, id: i + 1 }));
    const newTournament = createBracket(initialPods);
    setTournament(newTournament);
    saveState(newTournament);
  }, []);

  const advanceTournament = (currentState: TournamentState) => {
    let nextMatchId: string | null = null;
    let tournamentWinner: Pod | null = null;

    // Flatten all matches to find the next one
    const allMatches = currentState.rounds.flatMap(r => r.matches);
    const lastMatchIndex = allMatches.findIndex(m => m.id === currentState.currentMatchId);

    // Starting from after the last match, find the next unplayed match
    for (let i = lastMatchIndex + 1; i < allMatches.length; i++) {
        if (!allMatches[i].winner) {
            nextMatchId = allMatches[i].id;
            break;
        }
    }
    
    // If no next match is found, the tournament might be over
    if (!nextMatchId) {
        const lastRound = currentState.rounds[currentState.rounds.length - 1];
        if(lastRound.matches.length === 1 && lastRound.matches[0].winner) {
            tournamentWinner = lastRound.matches[0].winner;
        }
    }

    // Logic to populate pods for the next round
    for (const round of currentState.rounds) {
        for (const match of round.matches) {
            if(match.winner) {
                const { nextRound, nextMatchIndex, position } = findNextMatchSlot(currentState, match.id);
                if (nextRound && nextMatchIndex !== -1) {
                    if (position === 1) {
                        currentState.rounds[nextRound].matches[nextMatchIndex].pod1 = match.winner;
                    } else {
                        currentState.rounds[nextRound].matches[nextMatchIndex].pod2 = match.winner;
                    }
                }
            }
        }
    }


    const newState: TournamentState = {
      ...currentState,
      currentMatchId: nextMatchId,
      winner: tournamentWinner,
    };
    
    setTournament(newState);
    saveState(newState);
  };
  
  const findNextMatchSlot = (state: TournamentState, matchId: string) => {
      let currentRoundIndex = -1, currentMatchIndex = -1;
      
      state.rounds.forEach((r, rIdx) => {
          const mIdx = r.matches.findIndex(m => m.id === matchId);
          if (mIdx !== -1) {
              currentRoundIndex = rIdx;
              currentMatchIndex = mIdx;
          }
      });

      if (currentRoundIndex === -1 || currentRoundIndex + 1 >= state.rounds.length) {
          return { nextRound: null, nextMatchIndex: -1, position: -1 };
      }
      
      const nextRound = currentRoundIndex + 1;
      const nextMatchIndex = Math.floor(currentMatchIndex / 2);
      const position = currentMatchIndex % 2 === 0 ? 1 : 2;

      return { nextRound, nextMatchIndex, position };
  }


  const playMatch = useCallback((pod1Move: Move, pod2Move: Move) => {
    if (!tournament || !tournament.currentMatchId) return;

    setIsProcessing(true);
    let updatedTournament = JSON.parse(JSON.stringify(tournament));
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

    if (!match) {
        setIsProcessing(false);
        return;
    }

    let winner: Pod | null = null;
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
    if (winner) {
      match.winner = winner;
      match.loser = winner.id === match.pod1.id ? match.pod2 : match.pod1;
    }

    setTournament(updatedTournament);
    saveState(updatedTournament);

    setTimeout(() => {
      if(winner) {
        advanceTournament(updatedTournament);
      } else {
        if(match) match.moves = undefined;
        setTournament({...updatedTournament});
        saveState(updatedTournament);
      }
      setIsProcessing(false);
    }, 3000);

  }, [tournament, toast]);

  const resetTournament = useCallback(() => {
    setTournament(null);
    saveState(null);
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
    winner: tournament?.winner,
    isProcessing,
    currentRound
  };
}
