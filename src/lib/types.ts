export type Pod = {
  id: number;
  name: string;
  manager: string;
  emoji: string;
};

export type Move = 'rock' | 'paper' | 'scissors';

export type Match = {
  id: string;
  pod1: Pod | null;
  pod2: Pod | null;
  winner: Pod | null;
  loser: Pod | null;
  moves?: { pod1: Move; pod2: Move };
  moveHistory?: { pod1: Move; pod2: Move }[];
  isBye?: boolean;
};

export type Round = {
  id: number;
  matches: Match[];
};

export type TournamentState = {
  pods: Pod[];
  rounds: Round[];
  currentMatchId: string | null;
  winner: Pod | null;
  matchWinner?: {
    winner: Pod;
    winningMove: Move;
  } | null;
};
