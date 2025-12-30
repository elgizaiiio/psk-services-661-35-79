import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing, UserCharacter, MiningCharacter } from '@/types/mining';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useMarketplace = (userId: string | undefined) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          user_character:user_characters(
            *,
            character:mining_characters(*)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedListings = (data || []).map(listing => ({
        ...listing,
        user_character: listing.user_character ? {
          ...listing.user_character,
          character: listing.user_character.character as MiningCharacter
        } as UserCharacter : undefined,
        seller: undefined
      })) as MarketplaceListing[];
      
      setListings(formattedListings);
      logger.debug('Marketplace listings fetched', { count: formattedListings.length });
    } catch (error) {
      logger.error('Error fetching listings', error);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          user_character:user_characters(
            *,
            character:mining_characters(*)
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMyListings((data || []).map(listing => ({
        ...listing,
        user_character: listing.user_character ? {
          ...listing.user_character,
          character: listing.user_character.character as MiningCharacter
        } as UserCharacter : undefined
      })) as MarketplaceListing[]);
      logger.debug('My listings fetched', { count: data?.length || 0 });
    } catch (error) {
      logger.error('Error fetching my listings', error);
    }
  }, [userId]);

  const createListing = async (userCharacterId: string, priceTon: number, priceTokens: number) => {
    if (!userId) return false;

    try {
      // Check if character is already listed
      const existing = myListings.find(
        l => l.user_character_id === userCharacterId && l.status === 'active'
      );
      if (existing) {
        toast.error('This character is already listed');
        return false;
      }

      const { error } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: userId,
          user_character_id: userCharacterId,
          price_ton: priceTon,
          price_tokens: priceTokens
        });

      if (error) throw error;

      // Deactivate the character while listed
      await supabase
        .from('user_characters')
        .update({ is_active: false })
        .eq('id', userCharacterId);

      toast.success('Character listed for sale!');
      await Promise.all([fetchListings(), fetchMyListings()]);
      logger.info('Listing created successfully');
      return true;
    } catch (error) {
      logger.error('Error creating listing', error);
      toast.error('Failed to create listing');
      return false;
    }
  };

  const cancelListing = async (listingId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'cancelled' })
        .eq('id', listingId)
        .eq('seller_id', userId);

      if (error) throw error;

      toast.success('Listing cancelled');
      await Promise.all([fetchListings(), fetchMyListings()]);
      logger.info('Listing cancelled');
      return true;
    } catch (error) {
      logger.error('Error cancelling listing', error);
      toast.error('Failed to cancel listing');
      return false;
    }
  };

  const purchaseListing = async (listingId: string, paymentMethod: 'ton' | 'tokens') => {
    if (!userId) return false;

    try {
      const listing = listings.find(l => l.id === listingId);
      if (!listing) return false;

      if (listing.seller_id === userId) {
        toast.error("You can't buy your own listing");
        return false;
      }

      if (paymentMethod === 'tokens') {
        // Check token balance
        const { data: userData, error: userError } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        if ((userData?.token_balance || 0) < listing.price_tokens) {
          toast.error('Not enough tokens');
          return false;
        }

        // Deduct tokens from buyer
        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (userData?.token_balance || 0) - listing.price_tokens 
          })
          .eq('id', userId);

        // Add tokens to seller
        const { data: sellerData } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', listing.seller_id)
          .single();

        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (sellerData?.token_balance || 0) + listing.price_tokens 
          })
          .eq('id', listing.seller_id);

        // Transfer character ownership
        await supabase
          .from('user_characters')
          .update({ user_id: userId })
          .eq('id', listing.user_character_id);

        // Update listing status
        await supabase
          .from('marketplace_listings')
          .update({ 
            status: 'sold',
            sold_at: new Date().toISOString(),
            buyer_id: userId
          })
          .eq('id', listingId);

        toast.success('Character purchased!');
        await Promise.all([fetchListings(), fetchMyListings()]);
        logger.info('Character purchased successfully');
        return true;
      }

      toast.info('TON payment coming soon');
      return false;
    } catch (error) {
      logger.error('Error purchasing listing', error);
      toast.error('Failed to purchase');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchListings(), fetchMyListings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchListings, fetchMyListings]);

  return {
    listings,
    myListings,
    loading,
    createListing,
    cancelListing,
    purchaseListing,
    refetch: () => Promise.all([fetchListings(), fetchMyListings()])
  };
};
