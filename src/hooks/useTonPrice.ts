import { useState, useEffect, useCallback } from 'react';

interface TonPriceData {
  usd: number;
  lastUpdated: Date;
}

export const useTonPrice = () => {
  const [price, setPrice] = useState<number>(6.5); // Default fallback price
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      // Use CoinGecko free API (no API key required)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd',
        { cache: 'no-cache' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price');
      }
      
      const data = await response.json();
      const tonPrice = data['the-open-network']?.usd;
      
      if (tonPrice && typeof tonPrice === 'number') {
        setPrice(tonPrice);
        setError(null);
        // Cache the price in localStorage
        localStorage.setItem('ton_price', JSON.stringify({
          usd: tonPrice,
          lastUpdated: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('Error fetching TON price:', err);
      setError('Failed to fetch price');
      
      // Try to use cached price
      const cached = localStorage.getItem('ton_price');
      if (cached) {
        try {
          const cachedData: TonPriceData = JSON.parse(cached);
          setPrice(cachedData.usd);
        } catch {
          // Use default price
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check cached price first
    const cached = localStorage.getItem('ton_price');
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const lastUpdated = new Date(cachedData.lastUpdated);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        
        // Use cached price if less than 5 minutes old
        if (minutesSinceUpdate < 5) {
          setPrice(cachedData.usd);
          setIsLoading(false);
          return;
        }
      } catch {
        // Invalid cache, fetch new
      }
    }
    
    fetchPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  // Convert TON to USD
  const tonToUsd = useCallback((tonAmount: number): number => {
    return Number((tonAmount * price).toFixed(2));
  }, [price]);

  // Convert USD to TON
  const usdToTon = useCallback((usdAmount: number): number => {
    return Number((usdAmount / price).toFixed(4));
  }, [price]);

  // Format price for display
  const formatUsd = useCallback((tonAmount: number): string => {
    const usdValue = tonToUsd(tonAmount);
    return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [tonToUsd]);

  return {
    price,
    isLoading,
    error,
    tonToUsd,
    usdToTon,
    formatUsd,
    refetch: fetchPrice
  };
};
