import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { externalGames, categories, ExternalGame } from '@/data/externalGames';

const Arcade: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredGames = selectedCategory === 'all' 
    ? externalGames 
    : externalGames.filter(game => game.category === selectedCategory);

  const handleGameClick = (game: ExternalGame) => {
    navigate(`/arcade/game/${game.id}`);
  };

  return (
    <>
      <Helmet>
        <title>Arcade Games - Bolt</title>
        <meta name="description" content="Play exciting arcade games and earn BOLT rewards!" />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/mini-games')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Arcade</h1>
            </div>
          </div>

          {/* Category filters */}
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats banner */}
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-xl p-4 border border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العب واربح</p>
                  <p className="font-bold text-lg">+10-30 BOLT لكل لعبة</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {externalGames.length} لعبة
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Games grid */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGameClick(game)}
                className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="aspect-square relative">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Reward badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-primary-foreground text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      +{game.reward}
                    </Badge>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="font-bold text-white text-sm line-clamp-1">{game.title}</h3>
                    <p className="text-white/70 text-xs line-clamp-1">{game.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gamepad2 className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد ألعاب في هذه الفئة</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Arcade;
