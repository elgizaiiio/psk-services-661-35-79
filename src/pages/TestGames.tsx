import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Maximize2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const games = [
  {
    id: "slither-io",
    title: "Slither.io",
    embedUrl: "https://slither.io",
    description: "تحكم بثعبان وكل اللاعبين الآخرين لتكبر!",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "1v1-lol",
    title: "1v1.LOL",
    embedUrl: "https://1v1.lol",
    description: "لعبة بناء وقتال مثل Fortnite",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "krunker-io",
    title: "Krunker.io",
    embedUrl: "https://krunker.io",
    description: "لعبة FPS سريعة مثل CS:GO",
    color: "from-red-500 to-orange-600",
  },
];

const TestGames = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePlayGame = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleClose = () => {
    setActiveGame(null);
    setIsFullscreen(false);
  };

  const activeGameData = games.find((g) => g.id === activeGame);

  if (activeGame && activeGameData) {
    return (
      <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? "" : "p-4"}`}>
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-black/50 border-white/20 text-white hover:bg-white/20"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClose}
            className="bg-black/50 border-white/20 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <iframe
          src={activeGameData.embedUrl}
          className="w-full h-full rounded-lg"
          allow="fullscreen; autoplay"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Test Games</h1>
        </div>
      </div>

      {/* Games Grid */}
      <div className="p-4 space-y-4">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card"
          >
            <div className={`h-40 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
              <span className="text-4xl font-bold text-white drop-shadow-lg">
                {game.title}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-foreground mb-1">
                {game.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {game.description}
              </p>
              <Button
                onClick={() => handlePlayGame(game.id)}
                className={`w-full bg-gradient-to-r ${game.color} text-white font-bold`}
              >
                العب الآن 🎮
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TestGames;
