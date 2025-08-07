
import type { Pod, Move } from './types';

export const PODS: Omit<Pod, 'id'>[] = [
  { name: 'Owls', manager: 'Rebecca', emoji: '🦉' },
  { name: 'Racoons', manager: 'Aaron', emoji: '🦝' },
  { name: 'Octopus', manager: 'Paul', emoji: '🐙' },
  { name: 'Dolphins', manager: 'Jamie', emoji: '🐬' },
  { name: 'Orcas', manager: 'Tim', emoji: '🐳' },
  { name: 'Rakalis', manager: 'Richard', emoji: '🐀' },
  { name: 'Capybaras', manager: 'Laura', emoji: '🐹' },
  { name: 'Wombats', manager: 'Carina', emoji: '🐨' },
  { name: 'Bees', manager: 'Victoria', emoji: '🐝' },
  { name: 'Platypus', manager: 'Simon', emoji: '🦫' },
  { name: 'Senior Staff', manager: 'Mark C and Andrew B.', emoji: '👑' },
  { name: 'Associate Directors', manager: 'Maddie M and Sharon S', emoji: '🧑‍💼' },
  { name: 'Portfolio Managers', manager: 'Alex F and Shaun McC', emoji: '📈' },
  { name: 'Pandas', manager: 'Leila', emoji: '🐼' },
];

export const MOVES: Move[] = ['rock', 'paper', 'scissors'];
