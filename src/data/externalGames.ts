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
    thumbnail: 'https://img.gamemonetize.com/12b8whsjuoo362g7nvr31fxzbs19jnrl/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/12b8whsjuoo362g7nvr31fxzbs19jnrl/',
    category: 'action',
    description: 'Run, dodge trains and collect coins!',
    reward: 25
  },
  {
    id: 'moto-x3m',
    title: 'Moto X3M',
    thumbnail: 'https://img.gamemonetize.com/dpjd4cafq7knxvebtsvl23isv9o0d3vq/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/dpjd4cafq7knxvebtsvl23isv9o0d3vq/',
    category: 'racing',
    description: 'Extreme motorcycle stunts!',
    reward: 30
  },
  {
    id: 'basketball-stars',
    title: 'Basketball Stars',
    thumbnail: 'https://img.gamemonetize.com/rqh4acdr5ufucw4pfeazjxq0qaftgnv8/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/rqh4acdr5ufucw4pfeazjxq0qaftgnv8/',
    category: 'sports',
    description: 'Become a basketball legend!',
    reward: 20
  },
  {
    id: 'bubble-shooter',
    title: 'Bubble Shooter',
    thumbnail: 'https://img.gamemonetize.com/wt1tfo8ol71fabn4cvsojilamtozjfqg/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/wt1tfo8ol71fabn4cvsojilamtozjfqg/',
    category: 'puzzle',
    description: 'Pop all the bubbles!',
    reward: 15
  },
  {
    id: 'stickman-rush',
    title: 'Stickman Rush',
    thumbnail: 'https://img.gamemonetize.com/34nwkjqmsl1gc36sefoqb52hxd2570ub/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/34nwkjqmsl1gc36sefoqb52hxd2570ub/',
    category: 'action',
    description: 'Fast-paced stickman running!',
    reward: 20
  },
  {
    id: 'drift-boss',
    title: 'Drift Boss',
    thumbnail: 'https://img.gamemonetize.com/e9gkn4lv0e8zq3bqmthxl1r8wxwlxjmt/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/e9gkn4lv0e8zq3bqmthxl1r8wxwlxjmt/',
    category: 'racing',
    description: 'Master the art of drifting!',
    reward: 25
  },
  {
    id: 'penalty-shooters-2',
    title: 'Penalty Shooters 2',
    thumbnail: 'https://img.gamemonetize.com/whmq2zgp2xc1kk1oe0j9e9hdh4nk6p7q/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/whmq2zgp2xc1kk1oe0j9e9hdh4nk6p7q/',
    category: 'sports',
    description: 'Score penalty kicks!',
    reward: 20
  },
  {
    id: 'stack-colors',
    title: 'Stack Colors',
    thumbnail: 'https://img.gamemonetize.com/0oho3xpfcx3d7mhjl5snt2j4h5t9k0sj/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/0oho3xpfcx3d7mhjl5snt2j4h5t9k0sj/',
    category: 'casual',
    description: 'Stack and run with colors!',
    reward: 15
  },
  {
    id: 'helix-jump',
    title: 'Helix Jump',
    thumbnail: 'https://img.gamemonetize.com/1c17r1z8rmtxn1l8tqv7g7p7c9d8b5l8/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/1c17r1z8rmtxn1l8tqv7g7p7c9d8b5l8/',
    category: 'casual',
    description: 'Bounce through the helix tower!',
    reward: 15
  },
  {
    id: 'chess',
    title: 'Chess',
    thumbnail: 'https://img.gamemonetize.com/3r7xngjq2vlbcb8r0m8r0xc9l8f0b8r0/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/3r7xngjq2vlbcb8r0m8r0xc9l8f0b8r0/',
    category: 'puzzle',
    description: 'Classic chess game!',
    reward: 20
  },
  {
    id: 'gun-master',
    title: 'Gun Master',
    thumbnail: 'https://img.gamemonetize.com/2u9g9gxpwz5lgw6e9qch5z8f5e8p9g7e/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/2u9g9gxpwz5lgw6e9qch5z8f5e8p9g7e/',
    category: 'action',
    description: 'Aim and shoot targets!',
    reward: 25
  },
  {
    id: 'parking-fury-3d',
    title: 'Parking Fury 3D',
    thumbnail: 'https://img.gamemonetize.com/qhm1n7z2x3c4v5b6n8m9q0w1e2r3t4y5/512x512.jpg',
    embedUrl: 'https://html5.gamemonetize.co/qhm1n7z2x3c4v5b6n8m9q0w1e2r3t4y5/',
    category: 'racing',
    description: 'Park cars in tight spots!',
    reward: 20
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
