
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TournamentState, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useServerTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const previousTournamentStateRef = useRef<TournamentState | null>(null);

  useEffect(() => {
    previousTournamentStateRef.current = tournament;
  }, [tournament]);

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch('/api/tournament');
      if (!response.ok) {
        throw new Error('Failed to fetch tournament state');
      }
      const data = await response.json();
      
      if (JSON.stringify(data.tournament) !== JSON.stringify(tournament)) {
        setTournament(data.tournament);
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
    }
  }, [tournament]);

  // Toast notifications for match events
  useEffect(() => {
    const previousState = previousTournamentStateRef.current;
    if (tournament && previousState) {
        const allCurrentMatches = tournament.rounds.flatMap(r => r.matches);
        const allPreviousMatches = previousState.rounds.flatMap(r => r.matches);

        // Check for newly completed matches
        const newlyCompleted = allCurrentMatches.filter(current => {
            if (!current.winner || current.isBye) return false;
            const previous = allPreviousMatches.find(p => p.id === current.id);
            return !previous || !previous.winner;
        });

        newlyCompleted.forEach((match: Match, index) => {
            setTimeout(() => {
                toast({
                    title: "Match Complete! 🏆",
                    description: `${match.winner?.name} defeated ${match.loser?.name || 'opponent'}`,
                    duration: 4000,
                });

                if (match.loser) {
                    setTimeout(() => {
                        toast({
                            title: "Team Eliminated 😔",
                            description: `${match.loser?.name} has been eliminated from the tournament`,
                            duration: 4000,
                        });
                    }, 1000);
                }
            }, index * 2000); // Stagger notifications
        });

        // Check for new ties in the current match
        const currentMatch = allCurrentMatches.find(m => m.id === tournament.currentMatchId);
        const previousMatch = allPreviousMatches.find(m => m.id === tournament.currentMatchId);

        if (currentMatch && previousMatch && currentMatch.moveHistory && previousMatch.moveHistory) {
            if (currentMatch.moveHistory.length > previousMatch.moveHistory.length) {
                const latestRound = currentMatch.moveHistory[currentMatch.moveHistory.length - 1];
                if (latestRound.pod1 === latestRound.pod2) {
                    toast({
                        title: "Tie in Current Match! 🤝",
                        description: `${currentMatch.pod1?.name} vs ${currentMatch.pod2?.name} - both chose ${latestRound.pod1}. They must play again!`,
                        duration: 5000,
                    });
                }
            }
        }
    }
  }, [tournament, toast]);


  const startTournament = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
      }
    } catch (error) {
      console.error('Failed to start tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetTournament = useCallback(async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      if (response.ok) {
        setTournament(null);
      }
    } catch (error) {
      console.error('Failed to reset tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    fetchTournament(); 
    const interval = setInterval(fetchTournament, 3000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

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
    currentMatch,
    winner: tournament?.winner ?? null,
    isProcessing,
    currentRound,
    refetch: fetchTournament
  };
}
