import { useState, useEffect, useCallback } from 'react';

export const useEthPrice = () => {
  const [price, setPrice] = useState<number>(3500); // Fallback price
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { cache: 'no-cache' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch ETH price');
      }
      
      const data = await response.json();
      const ethPrice = data?.ethereum?.usd;
      
      if (typeof ethPrice === 'number' && ethPrice > 0) {
        setPrice(ethPrice);
      }
    } catch (err: any) {
      console.error('Error fetching ETH price:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, isLoading, error, refetch: fetchPrice };
};
