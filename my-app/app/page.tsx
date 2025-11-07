"use client";
import React from "react";
import { usePrices } from "../components/usePrices";
import { useDataFetcher } from "../components/getData";
import PriceTable from "../components/PriceTable";
import StatCard from "../components/StatCard";

export default function Home() {
  const { prices, loading } = usePrices();
  const { data: marketData, loading: marketLoading, error: marketError } = useDataFetcher(
    '/api/market-data'
  );
  const [selectedCoin, setSelectedCoin] = React.useState<string | null>(null);
  // Removed external coin metadata fetch; we only show websocket-provided stats now.

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <main
      className="grid min-h-screen gap-6 p-6 
                 grid-cols-1 lg:grid-cols-[2fr_1fr] 
                 grid-rows-[auto_auto_1fr] 
                 bg-background"
    >

      {/* 🟧 Global Stats (Full Width) */}
      <section className="lg:col-span-2 sticky ">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <h2 className="text-4xl text-center p-4 font-semibold  text-white  mb-1">CrypTrack</h2>
          <StatCard 
            title="Total Market Cap" 
            value={marketLoading ? "Loading..." : marketData ? formatNumber(marketData.totalMarketCap) : "$1.95T"} 
          />
          <StatCard 
            title="24h Volume" 
            value={marketLoading ? "Loading..." : marketData ? formatNumber(marketData.volume24h) : "$85.34B"} 
          />
          <StatCard 
            title="BTC Dominance" 
            value={marketLoading ? "Loading..." : marketData ? `${marketData.btcDominance.toFixed(1)}%` : "52.3%"} 
          />
          <StatCard 
            title="Active Cryptos" 
            value={marketLoading ? "Loading..." : marketData ? marketData.activeCryptos.toLocaleString() : "12,345"} 
          />
        </div>
      </section>

      {/* 🟩 Header (Full Width) */}
      

      

      {/* 🟦 Main Content (Left Column) */}
      <section className="space-y-6 w-full max-w-7xl text-foreground">
        {loading ? (
          <div className="text-center text-lg">Connecting to real-time price feed...</div>
        ) : (
          <PriceTable prices={prices} onSelectCoin={setSelectedCoin} />
        )}
      </section>

      {/* 🟨 Sidebar (Right Column) */}
      <aside className="bg-card border text-secondary-foreground border-border rounded-md shadow p-4 h-max">
        <h2 className="text-lg font-semibold mb-3">Coin Details</h2>
        {selectedCoin && prices[selectedCoin] ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              {prices[selectedCoin].logo && (
                <img
                  src={prices[selectedCoin].logo}
                  alt={prices[selectedCoin].name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h3 className="text-xl font-bold">{prices[selectedCoin].name}</h3>
                <p className="text-sm text-gray-500">{prices[selectedCoin].baseSymbol || selectedCoin}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Current Price</p>
                <p className="text-2xl font-bold">${parseFloat(prices[selectedCoin].price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">1h Change</p>
                  <p className={`font-semibold ${prices[selectedCoin].percentChange1h > 0 ? 'text-green-500' : 'text-red-500'}`}>{prices[selectedCoin].percentChange1h > 0 ? '+' : ''}{prices[selectedCoin].percentChange1h?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">24h Change</p>
                  <p className={`font-semibold ${prices[selectedCoin].percentChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>{prices[selectedCoin].percentChange24h > 0 ? '+' : ''}{prices[selectedCoin].percentChange24h?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">7d Change</p>
                  <p className={`font-semibold ${prices[selectedCoin].percentChange7d > 0 ? 'text-green-500' : 'text-red-500'}`}>{prices[selectedCoin].percentChange7d > 0 ? '+' : ''}{prices[selectedCoin].percentChange7d?.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">30d Change</p>
                  <p className={`font-semibold ${prices[selectedCoin].percentChange30d > 0 ? 'text-green-500' : 'text-red-500'}`}>{prices[selectedCoin].percentChange30d > 0 ? '+' : ''}{prices[selectedCoin].percentChange30d?.toFixed(2)}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">24h Volume</p>
                <p className="font-semibold">${parseFloat(prices[selectedCoin].volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>

              {prices[selectedCoin].rank && (
                <div>
                  <p className="text-xs text-gray-500">Market Rank</p>
                  <p className="font-semibold">#{prices[selectedCoin].rank}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Select a coin to view details here.</p>
        )}
      </aside>
    </main>
  );
}
