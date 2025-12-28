import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Gamepad2, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gameArterGames, gameArterCategories, GameArterGame } from '@/data/gameArterGames';

const GameArterArcade: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = gameArterGames.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.titleAr.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleGameClick = (game: GameArterGame) => {
    navigate(`/gamearter/${game.id}`);
  };

  const totalRewards = gameArterGames.reduce((sum, game) => sum + game.reward, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/games')}
            className="text-muted-foreground"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            GameArter Arcade
          </h1>
          <div className="w-10" />
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن لعبة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {gameArterCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap flex-shrink-0"
            >
              <span className="ml-1">{category.emoji}</span>
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-l from-primary/20 via-primary/10 to-transparent border border-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المكافآت المتاحة</p>
              <p className="text-xl font-bold text-foreground flex items-center gap-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                {totalRewards.toLocaleString()} BOLT
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold text-primary">{gameArterGames.length}</p>
            <p className="text-xs text-muted-foreground">لعبة متاحة</p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          {selectedCategory === 'all' ? 'جميع الألعاب' : gameArterCategories.find(c => c.id === selectedCategory)?.label}
          <span className="text-muted-foreground text-sm font-normal mr-2">
            ({filteredGames.length})
          </span>
        </h2>

        {filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">لا توجد ألعاب مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGameClick(game)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary border border-border group-hover:border-primary/50 transition-all">
                  {/* Placeholder gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary to-primary/10 flex items-center justify-center">
                    <Gamepad2 className="w-12 h-12 text-primary/50" />
                  </div>
                  
                  {/* Reward badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-yellow-500/90 text-black text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {game.reward}
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs">
                    {gameArterCategories.find(c => c.id === game.category)?.emoji}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold">العب الآن</span>
                  </div>
                </div>

                <div className="mt-2 px-1">
                  <h3 className="font-medium text-foreground text-sm truncate">{game.titleAr}</h3>
                  <p className="text-xs text-muted-foreground truncate">{game.descriptionAr}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameArterArcade;
