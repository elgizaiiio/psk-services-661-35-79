import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MiningCharacter, UserCharacter } from '@/types/mining';
import { toast } from 'sonner';

export const useMiningCharacters = (userId: string | undefined) => {
  const [characters, setCharacters] = useState<MiningCharacter[]>([]);
  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<UserCharacter | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mining_characters')
        .select('*')
        .eq('is_active', true)
        .order('price_ton', { ascending: true });

      if (error) throw error;
      setCharacters(data as MiningCharacter[] || []);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  }, []);

  const fetchUserCharacters = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_characters')
        .select(`
          *,
          character:mining_characters(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      const userChars = (data || []).map(uc => ({
        ...uc,
        character: uc.character as MiningCharacter
      })) as UserCharacter[];
      
      setUserCharacters(userChars);
      
      const active = userChars.find(uc => uc.is_active);
      setActiveCharacter(active || null);
    } catch (error) {
      console.error('Error fetching user characters:', error);
    }
  }, [userId]);

  const purchaseCharacter = async (characterId: string, paymentMethod: 'ton' | 'tokens') => {
    if (!userId) return false;

    const character = characters.find(c => c.id === characterId);
    if (!character) return false;

    try {
      // Check if user already owns this character
      const existing = userCharacters.find(uc => uc.character_id === characterId);
      if (existing) {
        toast.error('You already own this character');
        return false;
      }

      // For free characters (beginner), just add directly
      if (character.price_ton === 0 && character.price_tokens === 0) {
        const { error } = await supabase
          .from('user_characters')
          .insert({
            user_id: userId,
            character_id: characterId,
            is_active: userCharacters.length === 0
          });

        if (error) throw error;
        
        toast.success('Character acquired!');
        await fetchUserCharacters();
        return true;
      }

      if (paymentMethod === 'tokens') {
        // Check token balance
        const { data: userData, error: userError } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        if ((userData?.token_balance || 0) < character.price_tokens) {
          toast.error('Not enough tokens');
          return false;
        }

        // Deduct tokens and add character
        const { error: updateError } = await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (userData?.token_balance || 0) - character.price_tokens 
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        const { error: insertError } = await supabase
          .from('user_characters')
          .insert({
            user_id: userId,
            character_id: characterId,
            is_active: userCharacters.length === 0
          });

        if (insertError) throw insertError;

        toast.success('Character purchased!');
        await fetchUserCharacters();
        return true;
      }

      // TON payment would need wallet integration
      toast.info('TON payment coming soon');
      return false;
    } catch (error) {
      console.error('Error purchasing character:', error);
      toast.error('Failed to purchase character');
      return false;
    }
  };

  const activateCharacter = async (userCharacterId: string) => {
    if (!userId) return false;

    try {
      // Deactivate all characters
      await supabase
        .from('user_characters')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Activate selected character
      const { error } = await supabase
        .from('user_characters')
        .update({ is_active: true })
        .eq('id', userCharacterId);

      if (error) throw error;

      toast.success('Character activated!');
      await fetchUserCharacters();
      return true;
    } catch (error) {
      console.error('Error activating character:', error);
      toast.error('Failed to activate character');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCharacters(), fetchUserCharacters()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCharacters, fetchUserCharacters]);

  return {
    characters,
    userCharacters,
    activeCharacter,
    loading,
    purchaseCharacter,
    activateCharacter,
    refetch: () => Promise.all([fetchCharacters(), fetchUserCharacters()])
  };
};
