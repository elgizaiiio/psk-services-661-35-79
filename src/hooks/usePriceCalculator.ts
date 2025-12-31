import { useTonPrice } from './useTonPrice';
import { useCallback, useMemo } from 'react';

// Fixed prices
export const STAR_PRICE_USD = 0.02; // $0.02 per Star
export const BOLT_PRICE_USD = 0.001; // $0.001 per BOLT (1000 BOLT = $1)

export const usePriceCalculator = () => {
  const { price: tonPrice, isLoading, error, refetch } = useTonPrice();

  // Convert TON to USD
  const tonToUsd = useCallback(
    (tonAmount: number): number => {
      return Number((tonAmount * tonPrice).toFixed(2));
    },
    [tonPrice]
  );

  // Convert USD to TON
  const usdToTon = useCallback(
    (usdAmount: number): number => {
      return Number((usdAmount / tonPrice).toFixed(4));
    },
    [tonPrice]
  );

  // Convert TON to Stars
  const tonToStars = useCallback(
    (tonAmount: number): number => {
      const usdAmount = tonAmount * tonPrice;
      return Math.ceil(usdAmount / STAR_PRICE_USD);
    },
    [tonPrice]
  );

  // Convert USD to Stars
  const usdToStars = useCallback(
    (usdAmount: number): number => {
      return Math.ceil(usdAmount / STAR_PRICE_USD);
    },
    []
  );

  // Convert BOLT to USD
  const boltToUsd = useCallback((boltAmount: number): number => {
    return Number((boltAmount * BOLT_PRICE_USD).toFixed(2));
  }, []);

  // Convert BOLT to TON
  const boltToTon = useCallback(
    (boltAmount: number): number => {
      const usdAmount = boltAmount * BOLT_PRICE_USD;
      return Number((usdAmount / tonPrice).toFixed(4));
    },
    [tonPrice]
  );

  // Convert BOLT to Stars
  const boltToStars = useCallback(
    (boltAmount: number): number => {
      const usdAmount = boltAmount * BOLT_PRICE_USD;
      return Math.ceil(usdAmount / STAR_PRICE_USD);
    },
    []
  );

  // Format USD display
  const formatUsd = useCallback((usdAmount: number): string => {
    return `$${usdAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  // Format TON with USD equivalent
  const formatTonWithUsd = useCallback(
    (tonAmount: number): string => {
      const usd = tonToUsd(tonAmount);
      return `${tonAmount} TON (~$${usd})`;
    },
    [tonToUsd]
  );

  // Get Stars equivalent for TON amount (for display)
  const getStarsForTon = useCallback(
    (tonAmount: number): number => {
      return tonToStars(tonAmount);
    },
    [tonToStars]
  );

  return {
    // Current prices
    tonPrice,
    starPrice: STAR_PRICE_USD,
    boltPrice: BOLT_PRICE_USD,
    
    // Loading state
    isLoading,
    error,
    refetch,
    
    // Conversion functions
    tonToUsd,
    usdToTon,
    tonToStars,
    usdToStars,
    boltToUsd,
    boltToTon,
    boltToStars,
    
    // Formatting functions
    formatUsd,
    formatTonWithUsd,
    getStarsForTon,
  };
};
