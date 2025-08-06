
import type { Pod, Move } from './types';

export const PODS: Omit<Pod, 'id'>[] = [
  { name: 'Owls', manager: 'Rebecca', emoji: '🦉' },
  { name: 'Racoons', manager: 'Media team', emoji: '🦝' },
  { name: 'Octopus', manager: 'Paul', emoji: '🐙' },
  { name: 'Dolphins', manager: 'Jamie', emoji: '🐬' },
  { name: 'Orcas', manager: 'Tim', emoji: '🐳' },
  { name: 'Rakalis', manager: 'Richard', emoji: '🐀' },
  { name: 'Capybaras', manager: 'Laura', emoji: '🐹' },
  { name: 'Wombats', manager: 'Carina', emoji: '🐨' },
  { name: 'Bees', manager: 'Evan', emoji: '🐝' },
  { name: 'Senior Staff', manager: 'Leadership', emoji: '👑' },
  { name: 'Associate Directors', manager: 'Management', emoji: '🧑‍💼' },
  { name: 'Portfolio Managers', manager: 'Strategy', emoji: '📈' },
  { name: 'Pandas', manager: 'Leila', emoji: '🐼' },
  { name: 'Platypus', manager: 'Simon', emoji: '🦫' },
];

export const MOVES: Move[] = ['rock', 'paper', 'scissors'];
