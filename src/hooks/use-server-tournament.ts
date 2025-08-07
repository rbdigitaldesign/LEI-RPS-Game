
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TournamentState } from '@/lib/types';

export function useServerTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use a ref to hold the latest tournament state to avoid stale closures in fetchTournament
  const tournamentRef = useRef(tournament);
  useEffect(() => {
    tournamentRef.current = tournament;
  }, [tournament]);

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch('/api/tournament');
      if (!response.ok) {
        throw new Error('Failed to fetch tournament state');
      }
      const data = await response.json();
      
      // Only update state if the tournament data has actually changed.
      if (JSON.stringify(data.tournament) !== JSON.stringify(tournamentRef.current)) {
        setTournament(data.tournament);
      }

    } catch (error) {
      console.error('Failed to fetch tournament:', error);
    }
  }, []);

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
    const interval = setInterval(() => fetchTournament(), 3000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const currentMatch = tournament && tournament.currentMatchId
    ? tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId
    ? tournament.rounds.find(r => r.matches.some(m => m.id === tournament.currentMatchId))?.id ?? null
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
