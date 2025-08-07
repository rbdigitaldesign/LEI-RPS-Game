'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TournamentState } from '../lib/types';

export function useServerTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch('/api/tournament');
      const data = await response.json();
      setTournament(data.tournament);
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
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchTournament, 3000);
    return () => clearInterval(interval);
  }, [fetchTournament]);

  const currentMatch = tournament && tournament.currentMatchId
    ? tournament.rounds.flatMap(r => r.matches).find(m => m.id === tournament.currentMatchId) ?? null
    : null;

  const currentRound = tournament && tournament.currentMatchId
    ? tournament.rounds.findIndex(r => r.matches.some(m => m.id === tournament.currentMatchId)) + 1
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
