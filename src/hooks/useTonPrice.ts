import { useState, useEffect, useCallback } from 'react';

export const useTonPrice = () => {
  const [price, setPrice] = useState<number>(6.5); // Fallback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd',
        { cache: 'no-cache' }
      );

      if (!response.ok) throw new Error('Failed to fetch price');

      const data = await response.json();
      const tonPrice = data?.['the-open-network']?.usd;

      if (typeof tonPrice === 'number' && tonPrice > 0) {
        setPrice(tonPrice);
        setError(null);
      } else {
        throw new Error('Invalid price response');
      }
    } catch (err) {
      console.error('Error fetching TON price:', err);
      setError('Failed to fetch price');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const tonToUsd = useCallback(
    (tonAmount: number): number => Number((tonAmount * price).toFixed(2)),
    [price]
  );

  const usdToTon = useCallback(
    (usdAmount: number): number => Number((usdAmount / price).toFixed(4)),
    [price]
  );

  const formatUsd = useCallback(
    (tonAmount: number): string => {
      const usdValue = tonToUsd(tonAmount);
      return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [tonToUsd]
  );

  return {
    price,
    isLoading,
    error,
    tonToUsd,
    usdToTon,
    formatUsd,
    refetch: fetchPrice,
  };
};
