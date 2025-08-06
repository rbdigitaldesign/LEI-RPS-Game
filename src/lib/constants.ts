
import type { Pod, Move } from './types';

export const PODS: Omit<Pod, 'id'>[] = [
  { name: 'Pandas', manager: 'Leila', emoji: '🐼' },
  { name: 'Owls', manager: 'Rebecca', emoji: '🦉' },
  { name: 'Racoons', manager: 'Dave', emoji: '🦝' },
  { name: 'Octopus', manager: 'Paul', emoji: '🐙' },
  { name: 'Platypus', manager: 'Simon', emoji: '🦫' },
  { name: 'Dolphins', manager: 'Jamie', emoji: '🐬' },
  { name: 'Orcas', manager: 'Tim', emoji: '🐳' },
  { name: 'Rakalis', manager: 'Richard', emoji: '🐀' },
  { name: 'Capybaras', manager: 'Laura', emoji: '🐹' },
  { name: 'Wombats', manager: 'Carina', emoji: '🐨' },
  { name: 'Bees', manager: 'Evan', emoji: '🐝' },
];

export const FINAL_BOSS: Omit<Pod, 'id'> = {
    name: 'Cox Travis',
    manager: 'The Mastermind',
    emoji: '😈'
}

export const MOVES: Move[] = ['rock', 'paper', 'scissors'];
