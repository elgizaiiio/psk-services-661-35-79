export interface ExternalGame {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  category: 'action' | 'racing' | 'puzzle' | 'sports' | 'casual';
  description: string;
  reward: number;
}

export const externalGames: ExternalGame[] = [
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    thumbnail: 'https://img.gamemonetize.com/ulb3rxplz1v5dxghxkp0s4c4vm7x8rlq/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/ulb3rxplz1v5dxghxkp0s4c4vm7x8rlq/',
    category: 'action',
    description: 'Run, dodge trains and collect coins!',
    reward: 25
  },
  {
    id: 'temple-run-2',
    title: 'Temple Run 2',
    thumbnail: 'https://img.gamemonetize.com/s9hqw8m7oj8hlfcn3q7vcf6k3v0fxr6f/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/s9hqw8m7oj8hlfcn3q7vcf6k3v0fxr6f/',
    category: 'action',
    description: 'Escape the temple and survive!',
    reward: 25
  },
  {
    id: 'racing-limits',
    title: 'Racing Limits',
    thumbnail: 'https://img.gamemonetize.com/h5vgkx9kqxvnm8qhfxqhxg2d5xkjxkqm/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/h5vgkx9kqxvnm8qhfxqhxg2d5xkjxkqm/',
    category: 'racing',
    description: 'High-speed racing action!',
    reward: 30
  },
  {
    id: 'moto-x3m',
    title: 'Moto X3M',
    thumbnail: 'https://img.gamemonetize.com/t4b5mzcxqo1ht0hl9i1xhm5v0hvxk9mx/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/t4b5mzcxqo1ht0hl9i1xhm5v0hvxk9mx/',
    category: 'racing',
    description: 'Extreme motorcycle stunts!',
    reward: 30
  },
  {
    id: 'basketball-stars',
    title: 'Basketball Stars',
    thumbnail: 'https://img.gamemonetize.com/g7wqkfm5z8lx3ht0hl9ixhm5v0hvxk9m/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/g7wqkfm5z8lx3ht0hl9ixhm5v0hvxk9m/',
    category: 'sports',
    description: 'Become a basketball legend!',
    reward: 20
  },
  {
    id: 'soccer-skills',
    title: 'Soccer Skills World Cup',
    thumbnail: 'https://img.gamemonetize.com/zx8m5v0hvxk9mxt4b5mzcxqo1ht0hl9i/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/zx8m5v0hvxk9mxt4b5mzcxqo1ht0hl9i/',
    category: 'sports',
    description: 'Win the World Cup!',
    reward: 20
  },
  {
    id: 'bubble-shooter',
    title: 'Bubble Shooter',
    thumbnail: 'https://img.gamemonetize.com/1ht0hl9ixhm5v0hvxk9mxt4b5mzcxqo/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/1ht0hl9ixhm5v0hvxk9mxt4b5mzcxqo/',
    category: 'puzzle',
    description: 'Pop all the bubbles!',
    reward: 15
  },
  {
    id: 'tetris',
    title: 'Block Puzzle',
    thumbnail: 'https://img.gamemonetize.com/xhm5v0hvxk9mxt4b5mzcxqo1ht0hl9i/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/xhm5v0hvxk9mxt4b5mzcxqo1ht0hl9i/',
    category: 'puzzle',
    description: 'Classic block puzzle game!',
    reward: 15
  },
  {
    id: 'candy-crush',
    title: 'Candy Match 3',
    thumbnail: 'https://img.gamemonetize.com/v0hvxk9mxt4b5mzcxqo1ht0hl9ixhm5/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/v0hvxk9mxt4b5mzcxqo1ht0hl9ixhm5/',
    category: 'casual',
    description: 'Match candies and score!',
    reward: 10
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    thumbnail: 'https://img.gamemonetize.com/mxt4b5mzcxqo1ht0hl9ixhm5v0hvxk9/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/mxt4b5mzcxqo1ht0hl9ixhm5v0hvxk9/',
    category: 'casual',
    description: 'Tap to fly and avoid pipes!',
    reward: 10
  },
  {
    id: 'fruit-ninja',
    title: 'Fruit Ninja',
    thumbnail: 'https://img.gamemonetize.com/5mzcxqo1ht0hl9ixhm5v0hvxk9mxt4b/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/5mzcxqo1ht0hl9ixhm5v0hvxk9mxt4b/',
    category: 'casual',
    description: 'Slice fruits like a ninja!',
    reward: 10
  },
  {
    id: 'drift-hunters',
    title: 'Drift Hunters',
    thumbnail: 'https://img.gamemonetize.com/qo1ht0hl9ixhm5v0hvxk9mxt4b5mzcx/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.com/qo1ht0hl9ixhm5v0hvxk9mxt4b5mzcx/',
    category: 'racing',
    description: 'Master the art of drifting!',
    reward: 30
  }
];

export const categories = [
  { id: 'all', label: 'الكل', emoji: '🎮' },
  { id: 'action', label: 'أكشن', emoji: '🏃' },
  { id: 'racing', label: 'سباقات', emoji: '🚗' },
  { id: 'puzzle', label: 'ألغاز', emoji: '🧩' },
  { id: 'sports', label: 'رياضة', emoji: '⚽' },
  { id: 'casual', label: 'عادية', emoji: '🎯' }
];
