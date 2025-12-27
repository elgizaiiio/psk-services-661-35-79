import { useState, useCallback, useEffect, useRef } from 'react';
import { candyLevels, CandyLevel, getRandomCandy } from '@/data/candyLevels';

export interface CandyCell {
  id: string;
  candy: string;
  row: number;
  col: number;
  isMatched: boolean;
  isNew: boolean;
  isSpecial: 'bomb' | 'rocket-h' | 'rocket-v' | null;
}

export interface GameState {
  grid: CandyCell[][];
  score: number;
  moves: number;
  collectedCandies: Record<string, number>;
  combo: number;
  isAnimating: boolean;
}

export interface PlayerProgress {
  currentLevel: number;
  highestLevel: number;
  lives: number;
  lastLifeTime: number;
  totalScore: number;
  stars: Record<number, number>;
}

const MAX_LIVES = 5;
const LIFE_REGEN_TIME = 30 * 60 * 1000; // 30 minutes

const createInitialGrid = (rows: number, cols: number): CandyCell[][] => {
  const grid: CandyCell[][] = [];
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      let candy = getRandomCandy();
      
      // Avoid initial matches
      while (
        (col >= 2 && grid[row][col - 1]?.candy === candy && grid[row][col - 2]?.candy === candy) ||
        (row >= 2 && grid[row - 1]?.[col]?.candy === candy && grid[row - 2]?.[col]?.candy === candy)
      ) {
        candy = getRandomCandy();
      }
      
      grid[row][col] = {
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        candy,
        row,
        col,
        isMatched: false,
        isNew: false,
        isSpecial: null,
      };
    }
  }
  
  return grid;
};

const findMatches = (grid: CandyCell[][]): { row: number; col: number; length: number; direction: 'h' | 'v' }[] => {
  const matches: { row: number; col: number; length: number; direction: 'h' | 'v' }[] = [];
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  
  // Horizontal matches
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 2; col++) {
      const candy = grid[row][col]?.candy;
      if (!candy) continue;
      
      let length = 1;
      while (col + length < cols && grid[row][col + length]?.candy === candy) {
        length++;
      }
      
      if (length >= 3) {
        matches.push({ row, col, length, direction: 'h' });
        col += length - 1;
      }
    }
  }
  
  // Vertical matches
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 2; row++) {
      const candy = grid[row]?.[col]?.candy;
      if (!candy) continue;
      
      let length = 1;
      while (row + length < rows && grid[row + length]?.[col]?.candy === candy) {
        length++;
      }
      
      if (length >= 3) {
        matches.push({ row, col, length, direction: 'v' });
        row += length - 1;
      }
    }
  }
  
  return matches;
};

const loadProgress = (): PlayerProgress => {
  try {
    const saved = localStorage.getItem('candyCrushProgress');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading progress:', e);
  }
  
  return {
    currentLevel: 1,
    highestLevel: 1,
    lives: MAX_LIVES,
    lastLifeTime: Date.now(),
    totalScore: 0,
    stars: {},
  };
};

const saveProgress = (progress: PlayerProgress) => {
  try {
    localStorage.setItem('candyCrushProgress', JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
};

export const useCandyCrush = () => {
  const [level, setLevel] = useState<CandyLevel | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Calculate current lives based on time
  const calculateLives = useCallback(() => {
    const now = Date.now();
    const timePassed = now - progress.lastLifeTime;
    const livesRegened = Math.floor(timePassed / LIFE_REGEN_TIME);
    const newLives = Math.min(MAX_LIVES, progress.lives + livesRegened);
    
    if (newLives !== progress.lives) {
      const newProgress = {
        ...progress,
        lives: newLives,
        lastLifeTime: progress.lastLifeTime + (livesRegened * LIFE_REGEN_TIME),
      };
      setProgress(newProgress);
      saveProgress(newProgress);
    }
    
    return newLives;
  }, [progress]);

  const getTimeToNextLife = useCallback(() => {
    if (progress.lives >= MAX_LIVES) return 0;
    const now = Date.now();
    const timeSinceLastRegen = now - progress.lastLifeTime;
    return LIFE_REGEN_TIME - (timeSinceLastRegen % LIFE_REGEN_TIME);
  }, [progress]);

  const startLevel = useCallback((levelId: number) => {
    const currentLives = calculateLives();
    
    if (currentLives <= 0) {
      return { success: false, reason: 'no_lives' };
    }
    
    const levelData = candyLevels.find(l => l.id === levelId);
    if (!levelData) {
      return { success: false, reason: 'invalid_level' };
    }
    
    if (levelId > progress.highestLevel) {
      return { success: false, reason: 'locked' };
    }
    
    // Deduct a life
    const newProgress = {
      ...progress,
      lives: currentLives - 1,
      lastLifeTime: currentLives === MAX_LIVES ? Date.now() : progress.lastLifeTime,
      currentLevel: levelId,
    };
    setProgress(newProgress);
    saveProgress(newProgress);
    
    setLevel(levelData);
    setGameState({
      grid: createInitialGrid(levelData.gridSize.rows, levelData.gridSize.cols),
      score: 0,
      moves: levelData.moves,
      collectedCandies: {},
      combo: 0,
      isAnimating: false,
    });
    setGameStatus('playing');
    setSelectedCell(null);
    
    return { success: true };
  }, [progress, calculateLives]);

  const processMatches = useCallback(async () => {
    if (!gameState || !level) return;
    
    setGameState(prev => prev ? { ...prev, isAnimating: true } : null);
    
    let currentGrid = gameState.grid.map(row => row.map(cell => ({ ...cell })));
    let totalNewScore = 0;
    let newCollected = { ...gameState.collectedCandies };
    let currentCombo = 0;
    
    const processOnce = async (): Promise<boolean> => {
      const matches = findMatches(currentGrid);
      
      if (matches.length === 0) return false;
      
      currentCombo++;
      
      // Mark matched cells
      matches.forEach(match => {
        for (let i = 0; i < match.length; i++) {
          const row = match.direction === 'h' ? match.row : match.row + i;
          const col = match.direction === 'h' ? match.col + i : match.col;
          
          if (currentGrid[row]?.[col]) {
            const candy = currentGrid[row][col].candy;
            newCollected[candy] = (newCollected[candy] || 0) + 1;
            currentGrid[row][col].isMatched = true;
            
            // Create special candy for 4+ matches
            if (match.length >= 4 && i === Math.floor(match.length / 2)) {
              if (match.length === 4) {
                currentGrid[row][col].isSpecial = match.direction === 'h' ? 'rocket-h' : 'rocket-v';
              } else if (match.length >= 5) {
                currentGrid[row][col].isSpecial = 'bomb';
              }
            }
          }
        }
        
        totalNewScore += match.length * 10 * currentCombo;
      });
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Remove matched cells and drop
      const rows = currentGrid.length;
      const cols = currentGrid[0].length;
      
      for (let col = 0; col < cols; col++) {
        const column: (CandyCell | null)[] = [];
        
        // Collect non-matched cells
        for (let row = rows - 1; row >= 0; row--) {
          if (!currentGrid[row][col].isMatched) {
            column.push(currentGrid[row][col]);
          }
        }
        
        // Fill with new candies
        while (column.length < rows) {
          column.push({
            id: `new-${Date.now()}-${Math.random()}`,
            candy: getRandomCandy(),
            row: 0,
            col,
            isMatched: false,
            isNew: true,
            isSpecial: null,
          });
        }
        
        // Apply to grid
        for (let row = rows - 1; row >= 0; row--) {
          const cell = column[rows - 1 - row];
          if (cell) {
            currentGrid[row][col] = {
              ...cell,
              row,
              col,
              isMatched: false,
            };
          }
        }
      }
      
      setGameState(prev => prev ? {
        ...prev,
        grid: currentGrid.map(row => row.map(cell => ({ ...cell }))),
        score: prev.score + totalNewScore,
        collectedCandies: { ...newCollected },
        combo: currentCombo,
      } : null);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    };
    
    // Process cascades
    while (await processOnce()) {
      // Continue until no more matches
    }
    
    setGameState(prev => {
      if (!prev) return null;
      
      const newState = {
        ...prev,
        isAnimating: false,
        combo: 0,
      };
      
      // Check win/lose conditions
      if (level) {
        const goalsCompleted = level.goals.every(
          goal => (prev.collectedCandies[goal.candy] || 0) >= goal.count
        );
        
        if (goalsCompleted && prev.score >= level.targetScore) {
          setTimeout(() => {
            setGameStatus('won');
            
            // Calculate stars
            const scoreRatio = prev.score / level.targetScore;
            let stars = 1;
            if (scoreRatio >= 1.5) stars = 3;
            else if (scoreRatio >= 1.2) stars = 2;
            
            // Update progress
            setProgress(p => {
              const newP = {
                ...p,
                highestLevel: Math.max(p.highestLevel, level.id + 1),
                totalScore: p.totalScore + prev.score,
                stars: {
                  ...p.stars,
                  [level.id]: Math.max(p.stars[level.id] || 0, stars),
                },
              };
              saveProgress(newP);
              return newP;
            });
          }, 500);
        } else if (prev.moves <= 0) {
          setTimeout(() => setGameStatus('lost'), 500);
        }
      }
      
      return newState;
    });
  }, [gameState, level]);

  const swapCandies = useCallback((row1: number, col1: number, row2: number, col2: number) => {
    if (!gameState || gameState.isAnimating || gameState.moves <= 0) return false;
    
    // Check if adjacent
    const isAdjacent = 
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2);
    
    if (!isAdjacent) return false;
    
    // Perform swap
    const newGrid = gameState.grid.map(row => row.map(cell => ({ ...cell })));
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = { ...newGrid[row2][col2], row: row1, col: col1 };
    newGrid[row2][col2] = { ...temp, row: row2, col: col2 };
    
    // Check if swap creates match
    const matches = findMatches(newGrid);
    
    if (matches.length === 0) {
      // Swap back if no match
      return false;
    }
    
    setGameState(prev => prev ? {
      ...prev,
      grid: newGrid,
      moves: prev.moves - 1,
    } : null);
    
    // Process matches after swap
    setTimeout(() => processMatches(), 100);
    
    return true;
  }, [gameState, processMatches]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState || gameState.isAnimating) return;
    
    if (selectedCell) {
      const success = swapCandies(selectedCell.row, selectedCell.col, row, col);
      setSelectedCell(null);
      
      if (!success && (selectedCell.row !== row || selectedCell.col !== col)) {
        // If swap failed and clicked different cell, select new cell
        setSelectedCell({ row, col });
      }
    } else {
      setSelectedCell({ row, col });
    }
  }, [gameState, selectedCell, swapCandies]);

  const resetLevel = useCallback(() => {
    if (level) {
      startLevel(level.id);
    }
  }, [level, startLevel]);

  const exitGame = useCallback(() => {
    setLevel(null);
    setGameState(null);
    setGameStatus('idle');
    setSelectedCell(null);
  }, []);

  // Update lives periodically
  useEffect(() => {
    const interval = setInterval(() => {
      calculateLives();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [calculateLives]);

  return {
    level,
    gameState,
    progress,
    gameStatus,
    selectedCell,
    startLevel,
    handleCellClick,
    resetLevel,
    exitGame,
    calculateLives,
    getTimeToNextLife,
    maxLives: MAX_LIVES,
    candyLevels,
  };
};
