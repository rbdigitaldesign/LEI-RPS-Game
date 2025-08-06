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
  isDraw?: boolean;
  played: boolean;
};

export type Standing = {
  podId: number;
  name: string;
  emoji: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

export type TournamentState = {
  pods: Pod[];
  schedule: Match[];
  standings: Standing[];
  currentMatchId: string | null;
  winner: Pod | null; // Winner of the round robin part
  finalMatch: Match | null;
  gameWinner: Pod | null; // Overall game winner after final boss
  matchWinner?: {
    winner?: Pod;
    winningMove?: Move;
    isDraw?: boolean;
  } | null;
};
