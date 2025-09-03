
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
  isDraw?: boolean;
  isBye?: boolean;
};

export type Round = {
    id: number;
    name: string;
    matches: Match[];
}

export type TournamentState = {
  status: 'waiting' | 'readying' | 'countdown' | 'in_progress' | 'finished';
  pods: Pod[];
  readyTeams: string[];
  rounds: Round[];
  currentMatchId: string | null;
  winner: Pod | null;
};

    