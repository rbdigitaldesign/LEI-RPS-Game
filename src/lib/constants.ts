import type { Pod, Move } from './types';

export const PODS: Omit<Pod, 'id'>[] = [
  { name: 'Pandas', manager: 'Leila' },
  { name: 'Owls', manager: 'Rebecca' },
  { name: 'Racoons', manager: 'Dave' },
  { name: 'Octopus', manager: 'Paul' },
  { name: 'Platypus', manager: 'Simon' },
  { name: 'Dolphins', manager: 'Jamie' },
  { name: 'Orcas', manager: 'Tim' },
  { name: 'Rakali', manager: 'Richard' },
  { name: 'Capybara', manager: 'Laura' },
  { name: 'Wombats', manager: 'Carina' },
  { name: 'Bees', manager: 'Evan' },
];

export const MOVES: Move[] = ['rock', 'paper', 'scissors'];
