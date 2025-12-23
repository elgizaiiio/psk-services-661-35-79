import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';

interface GamePlayer {
  id: string;
  user_id?: string;
  telegram_id?: number;
  username?: string;
  coins: number;
  energy: number;
  max_energy: number;
  energy_refill_rate_minutes: number;
  current_skin: string;
  last_energy_at: string;
  created_at: string;
  updated_at: string;
}

interface GameScore {
  id: string;
  player_id: string;
  score: number;
  week_start: string;
  created_at: string;
}

interface GameSkin {
  id: string;
  name: string;
  skin_key: string;
  price_ton: number;
  is_active: boolean;
  created_at: string;
}

export const useGameData = () => {
  const { user: telegramUser } = useTelegramAuth();
  const [player, setPlayer] = useState<GamePlayer | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [skins, setSkins] = useState<GameSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializePlayer = useCallback(async () => {
    if (!telegramUser) return;

    try {
      let { data: existingPlayer, error: fetchError } = await supabase
        .from('game_players' as any)
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (fetchError && (fetchError as any).code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingPlayer) {
        const { data: newPlayer, error: createError } = await supabase
          .from('game_players' as any)
          .insert({
            telegram_id: telegramUser.id,
            username: telegramUser.username || telegramUser.first_name,
            coins: 0,
            energy: 5,
            max_energy: 5,
            energy_refill_rate_minutes: 10,
            current_skin: 'classic'
          })
          .select()
          .single();

        if (createError) throw createError;
        existingPlayer = newPlayer;
      }

      setPlayer(existingPlayer as unknown as GamePlayer);
    } catch (err: any) {
      console.error('Error initializing player:', err);
      setError(err.message);
    }
  }, [telegramUser]);

  const loadScores = useCallback(async () => {
    if (!player) return;

    try {
      const { data, error } = await supabase
        .from('game_scores' as any)
        .select('*')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScores((data || []) as unknown as GameScore[]);
    } catch (err: any) {
      console.error('Error loading scores:', err);
    }
  }, [player]);

  const loadSkins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_skins' as any)
        .select('*')
        .eq('is_active', true)
        .order('price_ton', { ascending: true });

      if (error) throw error;
      setSkins((data || []) as unknown as GameSkin[]);
    } catch (err: any) {
      console.error('Error loading skins:', err);
    }
  }, []);

  const submitScore = useCallback(async (score: number) => {
    if (!player) throw new Error('Player not found');

    try {
      const { error } = await supabase
        .from('game_scores' as any)
        .insert({
          player_id: player.id,
          score: score
        });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('game_players' as any)
        .update({
          coins: player.coins + score,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      await initializePlayer();
      await loadScores();
    } catch (err: any) {
      console.error('Error submitting score:', err);
      throw err;
    }
  }, [player, initializePlayer, loadScores]);

  const useEnergy = useCallback(async (amount: number = 1) => {
    if (!player || player.energy < amount) {
      throw new Error('Not enough energy');
    }

    try {
      const { error } = await supabase
        .from('game_players' as any)
        .update({
          energy: Math.max(0, player.energy - amount),
          last_energy_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (error) throw error;

      await initializePlayer();
    } catch (err: any) {
      console.error('Error using energy:', err);
      throw err;
    }
  }, [player, initializePlayer]);

  const calculateCurrentEnergy = useCallback(() => {
    if (!player) return 0;

    const now = new Date();
    const lastEnergyTime = new Date(player.last_energy_at);
    const minutesPassed = Math.floor((now.getTime() - lastEnergyTime.getTime()) / (1000 * 60));
    const energyToAdd = Math.floor(minutesPassed / player.energy_refill_rate_minutes);
    
    return Math.min(player.max_energy, player.energy + energyToAdd);
  }, [player]);

  const changeSkin = useCallback(async (skinKey: string) => {
    if (!player) throw new Error('Player not found');

    try {
      const { error } = await supabase
        .from('game_players' as any)
        .update({
          current_skin: skinKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (error) throw error;

      await initializePlayer();
    } catch (err: any) {
      console.error('Error changing skin:', err);
      throw err;
    }
  }, [player, initializePlayer]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          initializePlayer(),
          loadSkins()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initializePlayer, loadSkins]);

  useEffect(() => {
    if (player) {
      loadScores();
    }
  }, [player, loadScores]);

  return {
    player,
    scores,
    skins,
    loading,
    error,
    submitScore,
    useEnergy,
    calculateCurrentEnergy,
    changeSkin,
    refreshPlayer: initializePlayer,
    clearError: () => setError(null)
  };
};
