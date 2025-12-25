import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MemoryGameProps {
  coins: number;
  onWin: (amount: number) => void;
  onSpend: (amount: number) => boolean;
}

const EMOJIS = ["🎮", "🎯", "🎲", "🎰", "💎", "⚡", "🔥", "🌟"];
const PLAY_COST = 25;
const BASE_REWARD = 50;

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  coins,
  onWin,
  onSpend,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const initializeGame = useCallback(() => {
    const shuffledEmojis = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
  }, []);

  const startGame = () => {
    if (coins < PLAY_COST) {
      toast.error("عملات غير كافية!");
      return;
    }

    if (!onSpend(PLAY_COST)) return;

    setIsPlaying(true);
    initializeGame();
    toast.info("ابدأ اللعب! اعثر على الأزواج المتطابقة");
  };

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    setFlippedCards([...flippedCards, cardId]);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setMoves(m => m + 1);
      
      const [first, second] = flippedCards;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        // Match found
        setTimeout(() => {
          setCards(cards.map(c =>
            c.id === first || c.id === second
              ? { ...c, isMatched: true }
              : c
          ));
          setMatchedPairs(p => p + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(cards.map(c =>
            c.id === first || c.id === second
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (matchedPairs === EMOJIS.length && isPlaying) {
      setGameComplete(true);
      setIsPlaying(false);
      
      // Calculate reward based on moves
      const bonusMultiplier = Math.max(1, 3 - Math.floor(moves / 10));
      const reward = BASE_REWARD * bonusMultiplier;
      
      onWin(reward);
      toast.success(`🎉 أحسنت! ربحت ${reward} عملة في ${moves} حركة!`);
    }
  }, [matchedPairs, isPlaying, moves, onWin]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <div className="text-center">
          <p className="text-muted-foreground">الحركات</p>
          <p className="text-xl font-bold text-foreground">{moves}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">الأزواج</p>
          <p className="text-xl font-bold text-primary">{matchedPairs}/{EMOJIS.length}</p>
        </div>
      </div>

      {/* Game Grid */}
      {isPlaying || gameComplete ? (
        <div className="grid grid-cols-4 gap-2 p-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`w-16 h-16 rounded-xl cursor-pointer flex items-center justify-center text-2xl
                ${card.isFlipped || card.isMatched
                  ? "bg-primary/20 border-2 border-primary"
                  : "bg-card border-2 border-border hover:border-primary/50"
                }
                ${card.isMatched ? "opacity-60" : ""}
              `}
              onClick={() => handleCardClick(card.id)}
              whileHover={{ scale: card.isFlipped || card.isMatched ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "❓"}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-6xl">🧠</p>
            <p className="text-muted-foreground">اختبر ذاكرتك!</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {!isPlaying && (
        <Button
          onClick={startGame}
          size="lg"
          className="w-48 text-lg"
        >
          {gameComplete ? `العب مجدداً (${PLAY_COST} ⚡)` : `ابدأ (${PLAY_COST} ⚡)`}
        </Button>
      )}

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          رصيدك: {coins.toLocaleString()} ⚡
        </p>
        <p className="text-xs text-muted-foreground">
          المكافأة: {BASE_REWARD}-{BASE_REWARD * 3} عملة حسب السرعة
        </p>
      </div>
    </div>
  );
};

export default MemoryGame;
