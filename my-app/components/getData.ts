"use client";

import { useEffect, useState } from "react";

interface MarketData {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
  activeCryptos: number;
}

export function useDataFetcher(url: string) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚀 Fetching data from:', url);
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('🔍 Raw API Response:', result);
        
        const marketData: MarketData = {
          totalMarketCap: result.data?.quote?.USD?.total_market_cap || 0,
          volume24h: result.data?.quote?.USD?.total_volume_24h || 0,
          btcDominance: result.data?.btc_dominance || 0,
          activeCryptos: result.data?.active_cryptocurrencies || 0,
        };

        console.log('✅ Parsed Market Data:', marketData);
        setData(marketData);
      } catch (err) {
        console.error('❌ Error fetching market data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);

  return { data, loading, error };
}