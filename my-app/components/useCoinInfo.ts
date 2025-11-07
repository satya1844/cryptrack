"use client";

import { useEffect, useState } from "react";

interface CoinInfo {
  id: number;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  website: string[];
  twitter: string[];
  reddit: string[];
  chat: string[];
  explorer: string[];
  technical_doc: string[];
  date_added: string;
  tags: string[];
  category: string;
}

export function useCoinInfo(symbol: string | null) {
  const [data, setData] = useState<CoinInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      return;
    }

    const fetchCoinInfo = async () => {
      try {
        console.log('🔍 Fetching coin info for:', symbol);
        setLoading(true);
        setError(null);
        
  const response = await fetch(`/api/coin-info/${symbol}`, { cache: 'no-store' });
        
        if (!response.ok) {
          let body: any = undefined;
          try {
            body = await response.json();
          } catch {
            // ignore
          }
          const details = body?.details || body?.upstreamBody || body?.body;
          throw new Error(`HTTP error! status: ${response.status}${details ? ` - ${typeof details === 'string' ? details : JSON.stringify(details).slice(0, 500)}` : ''}`);
        }

        const result = await response.json();
        console.log('📊 Coin Info Response:', result);
        if (result.error) {
          throw new Error(result.error + (result.message ? `: ${result.message}` : ''));
        }
        
        // Extract coin data from response
  // Result shape: { symbol: BASE, data: { BASE: [ { ...metadata }] }}
  const coinData = result.data?.[symbol]?.[0] || result.data?.[result.symbol]?.[0];
        
        if (coinData) {
          const coinInfo: CoinInfo = {
            id: coinData.id,
            name: coinData.name,
            symbol: coinData.symbol,
            description: coinData.description || '',
            logo: coinData.logo || '',
            website: coinData.urls?.website || [],
            twitter: coinData.urls?.twitter || [],
            reddit: coinData.urls?.reddit || [],
            chat: coinData.urls?.chat || [],
            explorer: coinData.urls?.explorer || [],
            technical_doc: coinData.urls?.technical_doc || [],
            date_added: coinData.date_added || '',
            tags: coinData.tags || [],
            category: coinData.category || '',
          };
          
          console.log('✅ Parsed Coin Info:', coinInfo);
          setData(coinInfo);
        }
      } catch (err) {
        console.error('❌ Error fetching coin info:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoinInfo();
  }, [symbol]);

  return { data, loading, error };
}
