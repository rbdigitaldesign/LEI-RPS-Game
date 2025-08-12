
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TournamentState, Match } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useServerTournament() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const fetchTournamentCallback = useCallback(async () => {
    try {
      const response = await fetch('/api/tournament');
      if (!response.ok) {
        throw new Error('Failed to fetch tournament state');
      }
      const data = await response.json();
      
      setTournament(prevTournament => {
        if (JSON.stringify(data.tournament) !== JSON.stringify(prevTournament)) {
          return data.tournament;
        }
        return prevTournament;
      });

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
    fetchTournamentCallback(); 
    const interval = setInterval(fetchTournamentCallback, 3000);
    return () => clearInterval(interval);
  }, [fetchTournamentCallback]);

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
    refetch: fetchTournamentCallback
  };
}
