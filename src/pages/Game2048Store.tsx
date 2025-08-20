import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Zap, 
  Battery, 
  Trophy,
  Star,
  Crown,
  Sparkles,
  
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { toast } from 'sonner';

const game2048Items = [
  {
    id: 1,
    name: 'Energy Boost',
    description: 'Get 50 additional energy points',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.1 TON',
    priceValue: 0.1,
    category: 'energy',
    icon: Battery,
    color: 'neon-blue'
  },
  {
    id: 2,
    name: 'Score Multiplier',
    description: 'Double your points for 15 minutes',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.3 TON',
    priceValue: 0.3,
    category: 'booster',
    icon: Zap,
    color: 'neon-green'
  },
  {
    id: 3,
    name: 'Extra Lives',
    description: 'Get 3 additional attempts',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.2 TON',
    priceValue: 0.2,
    category: 'lives',
    icon: Trophy,
    color: 'neon-purple'
  },
  {
    id: 4,
    name: 'Starter Bundle',
    description: 'Energy + Multiplier + Extra Lives',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.5 TON',
    priceValue: 0.5,
    category: 'bundle',
    popular: true,
    icon: Star,
    color: 'neon-green'
  }
];

const skins = [
  {
    id: 1,
    name: 'Classic Theme',
    description: 'Original game style',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: 'Free',
    priceValue: 0,
    rarity: 'common'
  },
  {
    id: 2,
    name: 'Neon Theme',
    description: 'Amazing neon colors',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.3 TON',
    priceValue: 0.3,
    rarity: 'rare'
  },
  {
    id: 3,
    name: 'Golden Theme',
    description: 'Luxury golden design',
    image: '/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png',
    price: '0.8 TON',
    priceValue: 0.8,
    rarity: 'legendary'
  }
];

const Game2048Store: React.FC = () => {
  const navigate = useNavigate();
  const { sendDirectPayment, isProcessing, isWalletConnected } = useDirectTonPayment();
  const [processingItem, setProcessingItem] = useState<number | null>(null);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'neon-blue';
      case 'rare':
        return 'neon-purple';
      case 'legendary':
        return 'neon-orange';
      default:
        return 'neon-blue';
    }
  };

  const handlePurchase = async (item: any, type: 'powerup' | 'skin') => {
    if (!isWalletConnected) {
      toast.error('Please connect your TON wallet first');
      return;
    }

    setProcessingItem(item.id);
    
    try {
      const success = await sendDirectPayment({
        amount: item.priceValue,
        description: `${item.name} - 2048 Game ${type}`,
        productType: 'game_powerup',
        productId: item.id.toString(),
        credits: type === 'powerup' ? item.credits : undefined
      });

      if (success) {
        toast.success(`${item.name} purchased successfully! 🎉`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setProcessingItem(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>2048 Game Store | Power-ups & Themes</title>
        <meta name="description" content="Buy power-ups and themes for 2048 TON game and get amazing rewards" />
        <link rel="canonical" href="/game-2048-store" />
      </Helmet>

      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-primary" />
                2048 Game Store
              </h1>
              <p className="text-sm text-muted-foreground">Power-ups & themes for the game</p>
            </div>
          </div>

          {/* Power-ups Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Power-ups & Energy
            </h2>
            
            <div className="space-y-3">
              {game2048Items.map((item) => {
                const ItemIcon = item.icon;
                
                return (
                  <Card 
                    key={item.id}
                    className={`relative overflow-hidden border transition-all duration-300 hover:shadow-lg group ${
                      item.popular 
                        ? `border-${item.color}/40 bg-gradient-to-br from-${item.color}/5 to-background`
                        : `border-${item.color}/20 hover:border-${item.color}/30`
                    }`}
                  >
                    {item.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary p-1">
                        <p className="text-center text-xs font-bold text-white">Most Popular</p>
                      </div>
                    )}
                    
                    <CardContent className={`p-4 ${item.popular ? 'pt-8' : ''}`}>
                      <div className="flex items-center gap-3">

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm">{item.name}</h3>
                            <div className={`text-sm font-bold text-${item.color}`}>
                              {item.price}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                          <Button 
                            size="sm" 
                            className={`h-6 px-3 text-xs bg-${item.color}/20 border border-${item.color}/40 text-${item.color} hover:bg-${item.color}/30`}
                            onClick={() => handlePurchase(item, 'powerup')}
                            disabled={processingItem === item.id || !isWalletConnected}
                          >
                            {processingItem === item.id ? 'Processing...' : `Buy ${item.price}`}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Skins Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Themes & Designs
            </h2>
            
            <div className="space-y-3">
              {skins.map((skin) => {
                const rarityColor = getRarityColor(skin.rarity);
                
                return (
                  <Card 
                    key={skin.id}
                    className={`border border-${rarityColor}/20 hover:border-${rarityColor}/30 transition-all duration-300 hover:shadow-lg`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">

                        {/* Skin Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm">{skin.name}</h3>
                            <div className={`text-sm font-bold ${skin.priceValue === 0 ? 'text-green-500' : `text-${rarityColor}`}`}>
                              {skin.price}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{skin.description}</p>
                          <Button 
                            size="sm" 
                            className={`h-6 px-3 text-xs ${
                              skin.priceValue === 0 
                                ? 'bg-green-500/20 border border-green-500/40 text-green-500 hover:bg-green-500/30'
                                : `bg-${rarityColor}/20 border border-${rarityColor}/40 text-${rarityColor} hover:bg-${rarityColor}/30`
                            }`}
                            disabled={skin.priceValue === 0 || processingItem === skin.id || !isWalletConnected}
                            onClick={() => skin.priceValue > 0 && handlePurchase(skin, 'skin')}
                          >
                            {skin.priceValue === 0 
                              ? 'Active' 
                              : processingItem === skin.id 
                                ? 'Processing...' 
                                : `Buy ${skin.price}`
                            }
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Game2048Store;