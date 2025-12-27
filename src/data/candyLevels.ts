export interface CandyLevel {
  id: number;
  moves: number;
  targetScore: number;
  goals: {
    candy: string;
    count: number;
  }[];
  gridSize: { rows: number; cols: number };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: number;
}

const CANDY_TYPES = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐'];

export const candyLevels: CandyLevel[] = [
  // Easy levels (1-15)
  { id: 1, moves: 30, targetScore: 500, goals: [{ candy: '🍎', count: 10 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 10 },
  { id: 2, moves: 28, targetScore: 700, goals: [{ candy: '🍊', count: 12 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 10 },
  { id: 3, moves: 25, targetScore: 900, goals: [{ candy: '🍋', count: 15 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 12 },
  { id: 4, moves: 25, targetScore: 1000, goals: [{ candy: '🍎', count: 15 }, { candy: '🍊', count: 10 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 12 },
  { id: 5, moves: 25, targetScore: 1200, goals: [{ candy: '🍇', count: 18 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 15 },
  { id: 6, moves: 24, targetScore: 1400, goals: [{ candy: '🍓', count: 20 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 15 },
  { id: 7, moves: 24, targetScore: 1500, goals: [{ candy: '🫐', count: 18 }, { candy: '🍎', count: 12 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 18 },
  { id: 8, moves: 23, targetScore: 1700, goals: [{ candy: '🍊', count: 20 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 18 },
  { id: 9, moves: 23, targetScore: 1900, goals: [{ candy: '🍋', count: 22 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 20 },
  { id: 10, moves: 22, targetScore: 2000, goals: [{ candy: '🍇', count: 20 }, { candy: '🍓', count: 15 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 25 },
  { id: 11, moves: 22, targetScore: 2200, goals: [{ candy: '🍎', count: 25 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 20 },
  { id: 12, moves: 21, targetScore: 2400, goals: [{ candy: '🍊', count: 25 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 22 },
  { id: 13, moves: 21, targetScore: 2600, goals: [{ candy: '🍋', count: 25 }, { candy: '🍇', count: 15 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 22 },
  { id: 14, moves: 20, targetScore: 2800, goals: [{ candy: '🍓', count: 28 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 25 },
  { id: 15, moves: 20, targetScore: 3000, goals: [{ candy: '🫐', count: 25 }, { candy: '🍎', count: 20 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'easy', reward: 30 },

  // Medium levels (16-30)
  { id: 16, moves: 25, targetScore: 3500, goals: [{ candy: '🍎', count: 30 }, { candy: '🍊', count: 25 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 25 },
  { id: 17, moves: 24, targetScore: 3800, goals: [{ candy: '🍋', count: 30 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 28 },
  { id: 18, moves: 24, targetScore: 4000, goals: [{ candy: '🍇', count: 32 }, { candy: '🍓', count: 20 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 28 },
  { id: 19, moves: 23, targetScore: 4300, goals: [{ candy: '🫐', count: 35 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 30 },
  { id: 20, moves: 23, targetScore: 4500, goals: [{ candy: '🍎', count: 35 }, { candy: '🍊', count: 30 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 35 },
  { id: 21, moves: 22, targetScore: 4800, goals: [{ candy: '🍋', count: 35 }, { candy: '🍇', count: 25 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 32 },
  { id: 22, moves: 22, targetScore: 5000, goals: [{ candy: '🍓', count: 38 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 35 },
  { id: 23, moves: 21, targetScore: 5300, goals: [{ candy: '🫐', count: 35 }, { candy: '🍎', count: 30 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 35 },
  { id: 24, moves: 21, targetScore: 5500, goals: [{ candy: '🍊', count: 40 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 38 },
  { id: 25, moves: 20, targetScore: 5800, goals: [{ candy: '🍋', count: 40 }, { candy: '🍇', count: 30 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 40 },
  { id: 26, moves: 20, targetScore: 6000, goals: [{ candy: '🍓', count: 42 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 38 },
  { id: 27, moves: 19, targetScore: 6300, goals: [{ candy: '🫐', count: 40 }, { candy: '🍎', count: 35 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 40 },
  { id: 28, moves: 19, targetScore: 6500, goals: [{ candy: '🍊', count: 45 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 42 },
  { id: 29, moves: 18, targetScore: 6800, goals: [{ candy: '🍋', count: 42 }, { candy: '🍇', count: 35 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 45 },
  { id: 30, moves: 18, targetScore: 7000, goals: [{ candy: '🍓', count: 45 }, { candy: '🫐', count: 40 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'medium', reward: 50 },

  // Hard levels (31-45)
  { id: 31, moves: 22, targetScore: 7500, goals: [{ candy: '🍎', count: 50 }, { candy: '🍊', count: 45 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 45 },
  { id: 32, moves: 21, targetScore: 8000, goals: [{ candy: '🍋', count: 50 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 48 },
  { id: 33, moves: 21, targetScore: 8500, goals: [{ candy: '🍇', count: 52 }, { candy: '🍓', count: 40 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 50 },
  { id: 34, moves: 20, targetScore: 9000, goals: [{ candy: '🫐', count: 55 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 50 },
  { id: 35, moves: 20, targetScore: 9500, goals: [{ candy: '🍎', count: 55 }, { candy: '🍊', count: 50 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 55 },
  { id: 36, moves: 19, targetScore: 10000, goals: [{ candy: '🍋', count: 55 }, { candy: '🍇', count: 45 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 55 },
  { id: 37, moves: 19, targetScore: 10500, goals: [{ candy: '🍓', count: 58 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 58 },
  { id: 38, moves: 18, targetScore: 11000, goals: [{ candy: '🫐', count: 55 }, { candy: '🍎', count: 50 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 60 },
  { id: 39, moves: 18, targetScore: 11500, goals: [{ candy: '🍊', count: 60 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 60 },
  { id: 40, moves: 17, targetScore: 12000, goals: [{ candy: '🍋', count: 60 }, { candy: '🍇', count: 50 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 65 },
  { id: 41, moves: 17, targetScore: 12500, goals: [{ candy: '🍓', count: 62 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 65 },
  { id: 42, moves: 16, targetScore: 13000, goals: [{ candy: '🫐', count: 60 }, { candy: '🍎', count: 55 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 68 },
  { id: 43, moves: 16, targetScore: 13500, goals: [{ candy: '🍊', count: 65 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 70 },
  { id: 44, moves: 15, targetScore: 14000, goals: [{ candy: '🍋', count: 65 }, { candy: '🍇', count: 55 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 72 },
  { id: 45, moves: 15, targetScore: 14500, goals: [{ candy: '🍓', count: 65 }, { candy: '🫐', count: 60 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'hard', reward: 75 },

  // Expert levels (46-50)
  { id: 46, moves: 18, targetScore: 15000, goals: [{ candy: '🍎', count: 70 }, { candy: '🍊', count: 65 }, { candy: '🍋', count: 60 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'expert', reward: 80 },
  { id: 47, moves: 17, targetScore: 16000, goals: [{ candy: '🍇', count: 70 }, { candy: '🍓', count: 65 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'expert', reward: 85 },
  { id: 48, moves: 16, targetScore: 17000, goals: [{ candy: '🫐', count: 75 }, { candy: '🍎', count: 70 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'expert', reward: 90 },
  { id: 49, moves: 15, targetScore: 18000, goals: [{ candy: '🍊', count: 75 }, { candy: '🍋', count: 70 }, { candy: '🍇', count: 65 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'expert', reward: 95 },
  { id: 50, moves: 15, targetScore: 20000, goals: [{ candy: '🍓', count: 80 }, { candy: '🫐', count: 75 }, { candy: '🍎', count: 70 }], gridSize: { rows: 8, cols: 8 }, difficulty: 'expert', reward: 100 },
];

export const getCandyTypes = () => CANDY_TYPES;
export const getRandomCandy = () => CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
