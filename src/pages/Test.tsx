import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import DuckCard from '@/components/duck/DuckCard';
import DuckDetailModal from '@/components/duck/DuckDetailModal';
import { duckCharacters } from '@/data/duckCharacters';
import { DuckCharacter, DuckRarity } from '@/types/duck-characters';

const rarityFilters: { value: DuckRarity | 'all'; label: string; labelAr: string }[] = [
  { value: 'all', label: 'All', labelAr: 'الكل' },
  { value: 'common', label: 'Common', labelAr: 'عادي' },
  { value: 'rare', label: 'Rare', labelAr: 'نادر' },
  { value: 'epic', label: 'Epic', labelAr: 'أسطوري' },
  { value: 'legendary', label: 'Legendary', labelAr: 'خرافي' },
];

const Test: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDuck, setSelectedDuck] = useState<DuckCharacter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DuckRarity | 'all'>('all');

  const filteredDucks = activeFilter === 'all' 
    ? duckCharacters 
    : duckCharacters.filter(duck => duck.rarity === activeFilter);

  const handleDuckClick = (duck: DuckCharacter) => {
    setSelectedDuck(duck);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDuck(null), 300);
  };

  const getRarityCount = (rarity: DuckRarity) => 
    duckCharacters.filter(d => d.rarity === rarity).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Duck Characters</h1>
            <p className="text-xs text-muted-foreground">شخصيات البط</p>
          </div>
          <div className="w-10" />
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-3 bg-muted/30"
      >
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{duckCharacters.length}</p>
            <p className="text-xs text-muted-foreground">Total Ducks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-500">{getRarityCount('legendary')}</p>
            <p className="text-xs text-muted-foreground">Legendary</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-500">{getRarityCount('epic')}</p>
            <p className="text-xs text-muted-foreground">Epic</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{getRarityCount('rare')}</p>
            <p className="text-xs text-muted-foreground">Rare</p>
          </div>
        </div>
      </motion.div>

      {/* Filter buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide"
      >
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {rarityFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
            className="flex-shrink-0 text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </motion.div>

      {/* Duck grid */}
      <div className="px-4 py-4">
        <motion.div
          className="grid grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {filteredDucks.map((duck) => (
            <motion.div
              key={duck.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <DuckCard
                duck={duck}
                onClick={() => handleDuckClick(duck)}
                isSelected={selectedDuck?.id === duck.id}
              />
            </motion.div>
          ))}
        </motion.div>

        {filteredDucks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-4xl mb-2">🦆</p>
            <p className="text-muted-foreground">No ducks found with this rarity</p>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      <DuckDetailModal
        duck={selectedDuck}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Test;
