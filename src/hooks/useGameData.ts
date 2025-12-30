import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GameData');

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
      const { data: existingPlayer, error: fetchError } = await supabase
        .from('game_players')
        .select('*')
        .eq('user_id', String(telegramUser.id))
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingPlayer) {
        const { data: newPlayer, error: createError } = await supabase
          .from('game_players')
          .insert({
            user_id: String(telegramUser.id),
            username: telegramUser.username || telegramUser.first_name,
            coins: 0,
            current_skin: 'default'
          })
          .select()
          .single();

        if (createError) throw createError;
        setPlayer(newPlayer as unknown as GamePlayer);
      } else {
        setPlayer(existingPlayer as unknown as GamePlayer);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error initializing player', err);
      setError(errorMessage);
    }
  }, [telegramUser]);

  const loadScores = useCallback(async () => {
    if (!player) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', player.user_id || '')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setScores((data || []) as unknown as GameScore[]);
    } catch (err) {
      logger.error('Error loading scores', err);
    }
  }, [player]);

  const loadSkins = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('game_skins')
        .select('*')
        .eq('is_active', true)
        .order('price_coins', { ascending: true });

      if (fetchError) throw fetchError;
      setSkins((data || []) as unknown as GameSkin[]);
    } catch (err) {
      logger.error('Error loading skins', err);
    }
  }, []);

  const submitScore = useCallback(async (score: number) => {
    if (!player) throw new Error('Player not found');

    try {
      const { error: insertError } = await supabase
        .from('game_scores')
        .insert({
          user_id: player.user_id || '',
          score: score
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('game_players')
        .update({
          coins: player.coins + score,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      await initializePlayer();
      await loadScores();
    } catch (err) {
      logger.error('Error submitting score', err);
      throw err;
    }
  }, [player, initializePlayer, loadScores]);

  const useEnergy = useCallback(async (amount: number = 1) => {
    if (!player || (player.energy || 0) < amount) {
      throw new Error('Not enough energy');
    }

    try {
      const { error: updateError } = await supabase
        .from('game_players')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      await initializePlayer();
    } catch (err) {
      logger.error('Error using energy', err);
      throw err;
    }
  }, [player, initializePlayer]);

  const calculateCurrentEnergy = useCallback(() => {
    if (!player) return 0;
    return player.energy || 5;
  }, [player]);

  const changeSkin = useCallback(async (skinKey: string) => {
    if (!player) throw new Error('Player not found');

    try {
      const { error: updateError } = await supabase
        .from('game_players')
        .update({
          current_skin: skinKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', player.id);

      if (updateError) throw updateError;

      await initializePlayer();
    } catch (err) {
      logger.error('Error changing skin', err);
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
