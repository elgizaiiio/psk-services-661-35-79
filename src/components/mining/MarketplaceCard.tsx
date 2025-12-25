import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketplaceListing } from '@/types/mining';
import { useLanguage } from '@/contexts/LanguageContext';
import { Coins, User, ShoppingCart, X } from 'lucide-react';

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  onPurchase?: (listingId: string, method: 'ton' | 'tokens') => void;
  onCancel?: (listingId: string) => void;
  isOwner?: boolean;
  isLoading?: boolean;
}

const tierColors: Record<string, string> = {
  beginner: 'bg-slate-500',
  professional: 'bg-blue-500',
  expert: 'bg-purple-500',
  master: 'bg-orange-500',
  legendary: 'bg-yellow-500',
};

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  listing,
  onPurchase,
  onCancel,
  isOwner,
  isLoading
}) => {
  const { language, t } = useLanguage();
  
  const character = listing.user_character?.character;
  if (!character) return null;

  const getName = () => {
    if (language === 'ru') return character.name_ru;
    return character.name;
  };

  const sellerName = listing.seller?.telegram_username || listing.seller?.first_name || 'Unknown';

  return (
    <Card className="p-4 bg-card/50 border border-border/50">
      <div className="flex items-center gap-4">
        <div className="text-4xl">{character.image_url}</div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">{getName()}</h3>
            <Badge className={`${tierColors[character.tier]} text-white text-xs`}>
              {character.tier.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{sellerName}</span>
            <span>•</span>
            <span>Lv.{listing.user_character?.level || 1}</span>
          </div>
        </div>

        <div className="text-right">
          {listing.price_tokens > 0 && (
            <div className="flex items-center gap-1 text-foreground font-bold">
              <Coins className="w-4 h-4 text-yellow-500" />
              {listing.price_tokens.toLocaleString()}
            </div>
          )}
          {listing.price_ton > 0 && (
            <div className="text-sm text-primary font-medium">
              {listing.price_ton} TON
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isOwner ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onCancel?.(listing.id)}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Listing
          </Button>
        ) : (
          <div className="flex gap-2">
            {listing.price_tokens > 0 && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onPurchase?.(listing.id, 'tokens')}
                disabled={isLoading}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('marketplace.buy')}
              </Button>
            )}
            {listing.price_ton > 0 && (
              <Button
                className="flex-1"
                onClick={() => onPurchase?.(listing.id, 'ton')}
                disabled={isLoading}
              >
                {listing.price_ton} TON
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MarketplaceCard;
