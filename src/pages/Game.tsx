import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";


// Types
type Player = {
  id: string;
  username: string | null;
  telegram_id: number | null;
  energy: number;
  max_energy: number;
  coins: number;
  current_skin: string;
};

type Skin = {
  skin_key: string;
  name: string;
  price_ton: number;
};

// 2048 helpers
const GRID_SIZE = 4;

type Board = number[][];

const emptyBoard = (): Board => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

function addRandomTile(board: Board): Board {
  const empty: { r: number; c: number }[] = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push({ r, c }); }));
  if (empty.length === 0) return board;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const copy = board.map(row => row.slice());
  copy[r][c] = value;
  return copy;
}

function initBoard(): Board {
  let b = emptyBoard();
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

function compress(line: number[]): { line: number[]; scoreGain: number } {
  const filtered = line.filter(v => v !== 0);
  let scoreGain = 0;
  const merged: number[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      scoreGain += val;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return { line: merged, scoreGain };
}

function rotate(board: Board): Board { // rotate clockwise
  const res = emptyBoard();
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) res[c][GRID_SIZE - 1 - r] = board[r][c];
  return res;
}

function moveLeft(board: Board): { board: Board; moved: boolean; scoreGain: number } {
  let moved = false; let totalGain = 0;
  const res = board.map(row => {
    const { line, scoreGain } = compress(row);
    if (line.some((v, i) => v !== row[i])) moved = true;
    totalGain += scoreGain;
    return line;
  });
  return { board: res, moved, scoreGain: totalGain };
}

function move(board: Board, dir: "left" | "right" | "up" | "down") {
  let b = board;
  let times = 0;
  if (dir === "up") times = 3;
  if (dir === "right") times = 2;
  if (dir === "down") times = 1;
  for (let i = 0; i < times; i++) b = rotate(b);
  const res = moveLeft(b);
  for (let i = 0; i < (4 - times) % 4; i++) res.board = rotate(res.board);
  return res;
}

function hasMoves(board: Board) {
  // If any zero or any adjacent equals
  for (let r = 0; r < GRID_SIZE; r++) for (let c = 0; c < GRID_SIZE; c++) {
    if (board[r][c] === 0) return true;
    if (r < GRID_SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
    if (c < GRID_SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
  }
  return false;
}

const tileColors: Record<string, string> = {
  classic: "",
  neon: "shadow-[var(--shadow-glow)]",
  gold: "ring-1 ring-primary/30",
  cosmic: "bg-gradient-to-br from-primary/10 to-accent/10",
  lava: "bg-gradient-to-br from-primary/10 to-secondary/10",
  ice: "bg-gradient-to-br from-muted to-background",
  emerald: "ring-1 ring-secondary/30",
  violet: "ring-1 ring-accent/30",
};

const Game: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  useTelegramBackButton();
  const [player, setPlayer] = useState<Player | null>(null);
  
  const [, setSkins] = useState<Skin[]>([]);

  const [board, setBoard] = useState<Board>(initBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [running, setRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const prevBoard = useRef<Board | null>(null);
  const prevScore = useRef<number>(0);

  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 24;
  const skinClass = useMemo(() => tileColors[player?.current_skin || "classic"], [player]);
  
  const callApi = useCallback(async (action: string, payload?: any) => {
    const { data, error } = await supabase.functions.invoke("game-api", {
      body: { action, payload: { ...payload } },
    });
    if (error) throw error;
    return data as any;
  }, []);

  const loadPlayer = useCallback(async () => {
    try {
      const data = await callApi("get_player", {
        telegram_id: tgUser?.id,
        username: tgUser?.username,
      });
      setPlayer(data.player);
      
      setSkins(data.skins || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load player");
    }
  }, [callApi, tgUser]);

  useEffect(() => { loadPlayer(); }, [loadPlayer]);

  const startGame = async () => {
    if (!player) return;
    try {
      const data = await callApi("spend_energy", { telegram_id: player.telegram_id, username: player.username });
      setPlayer(data.player);
      setScore(0);
      setBoard(initBoard());
      setRunning(true);
      setIsFullscreen(true);
      setUndoAvailable(false);
    } catch (e: any) {
      toast.error(e.message || "Insufficient energy");
    }
  };

  const finishGame = async () => {
    setRunning(false);
    setIsFullscreen(false);
    setBest(b => Math.max(b, score));
    try {
      const response = await callApi("submit_score", { telegram_id: player?.telegram_id, score });
      if (response?.coinsEarned > 0) {
        toast.success(`Game finished! Earned ${response.coinsEarned} viral coins!`);
        if (response.player) {
          setPlayer(response.player);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMove = (dir: "left" | "right" | "up" | "down") => {
    if (!running) return;
    const { board: nb, moved, scoreGain } = move(board, dir);
    if (!moved) return;
    prevBoard.current = board.map(r => r.slice());
    prevScore.current = score;
    const withNew = addRandomTile(nb);
    setBoard(withNew);
    const newScore = score + scoreGain;
    setScore(newScore);
    if (!hasMoves(withNew)) {
      toast.success("Game Over!");
      finishGame();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleMove("left");
      if (e.key === "ArrowRight") handleMove("right");
      if (e.key === "ArrowUp") handleMove("up");
      if (e.key === "ArrowDown") handleMove("down");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  
  // Touch controls for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchMove = (_e: React.TouchEvent) => {
    // Allow native page scrolling; swipe is handled onTouchEnd only
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !running) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    touchStartRef.current = null;
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return;
    if (absX > absY) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };
  


  const buyEnergy = async () => {
    if (!player) return;
    try {
      const data = await callApi("purchase", {
        telegram_id: player.telegram_id,
        item_type: "energy",
        amount_ton: 0.02,
      });
      setPlayer(data.player);
      toast.success("Energy purchased successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to purchase energy");
    }
  };

  const buyUndoBooster = async () => {
    if (!player) return;
    try {
      await callApi("purchase", {
        telegram_id: player.telegram_id,
        item_type: "booster",
        item_key: "undo",
        amount_ton: 0.01,
      });
      setUndoAvailable(true);
      toast.success("Undo booster purchased for one-time use");
    } catch (e: any) {
      toast.error(e.message || "Failed to purchase booster");
    }
  };

  const undoMove = () => {
    if (undoAvailable && prevBoard.current) {
      setBoard(prevBoard.current);
      setScore(prevScore.current);
      setUndoAvailable(false);
    }
  };

  const claimDaily = async () => {
    try {
      const res = await callApi("claim_daily", { telegram_id: player?.telegram_id });
      setPlayer(res.player);
      toast.success(`Daily reward claimed (+${res.rewardCoins} coins)`);
    } catch (e: any) {
      toast.error(e.message || "Failed to claim reward");
    }
  };


  const energyPct = player ? (player.energy / player.max_energy) * 100 : 0;

  if (isFullscreen && running) {
    return (
      <main className="fixed inset-0 z-50 bg-background flex flex-col">
        <Helmet>
          <title>2048 TON Game – Playing</title>
        </Helmet>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="text-2xl font-bold text-primary">{score}</div>
          </div>
          <Button size="sm" variant="destructive" onClick={finishGame}>
            Exit
          </Button>
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Best</div>
            <div className="text-2xl font-bold">{best}</div>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className={cn(
              "grid grid-cols-4 gap-2 p-3 rounded-xl bg-muted w-full max-w-sm aspect-square",
              skinClass,
              "touch-none overscroll-none"
            )}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {board.flatMap((row, r) => row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xl font-bold select-none",
                  val === 0 ? "bg-background text-muted-foreground" : "bg-primary/10 text-primary"
                )}
              >
                {val || ""}
              </div>
            )))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Swipe to move</span>
            <Button size="sm" variant="outline" disabled={!undoAvailable} onClick={undoMove}>Undo</Button>
            <Button size="sm" variant="outline" onClick={buyUndoBooster}>Buy Undo</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto p-4 pb-24 space-y-4">
      <Helmet>
        <title>2048 TON Game – Energy, Boosters, Skins | Play & Compete</title>
        <meta name="description" content="Play a 2048-like TON-powered game with energy, boosters, daily rewards, skins, and weekly leaderboards. Mobile-friendly & embeddable." />
        <link rel="canonical" href={`${window.location.origin}/game`} />
      </Helmet>


      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Player</p>
            <p className="font-medium">{player?.username || `TG:${player?.telegram_id || ""}`}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Coins</p>
            <p className="font-medium">{Number(player?.coins || 0).toFixed(0)}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Energy</span>
            <span className="text-xs text-muted-foreground">{player?.energy}/{player?.max_energy}</span>
          </div>
          <Progress value={energyPct} />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={startGame} disabled={!player || (player?.energy || 0) <= 0}>
              Start Game
            </Button>
            <Button size="sm" variant="secondary" onClick={buyEnergy}>
              Buy Energy (TON)
            </Button>
            <Button size="sm" variant="outline" onClick={claimDaily}>
              Daily Reward
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-sm text-muted-foreground">Best</div>
            <div className="text-2xl font-bold">{best}</div>
          </div>
        </div>

        {/* Board */}
        <div
          className={cn(
            "grid grid-cols-4 gap-2 p-2 rounded-xl bg-muted",
            skinClass,
            running && "touch-none overscroll-none"
          )}
          aria-label="2048 game board (swipe to move)"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {board.flatMap((row, r) => row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center text-lg font-bold select-none",
                val === 0 ? "bg-background text-muted-foreground" : "bg-primary/10 text-primary"
              )}
            >
              {val || ""}
            </div>
          )))}
        </div>

        <div className="text-center text-sm text-muted-foreground">Click "Start Game" to play</div>
      </Card>
    </main>
  );
};

export default Game;
