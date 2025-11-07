"use client";

import PriceRow from "./PriceRow";

interface PriceTableProps {
  prices: Record<string, any>;
  onSelectCoin?: (symbol: string) => void;
}

export default function PriceTable({ prices, onSelectCoin }: PriceTableProps) {

  const symbols = Object.keys(prices);

  if (symbols.length === 0) {
    return <div className="text-center p-4 text-white">Awaiting price data...</div>;
  }

  return (
    <table className="w-full bg-card border text-secondary-foreground border-border rounded-2xl ">
      <thead className="rounded-2xl">
        <tr className="bg-card text-left rounded-2xl">
          <th className="p-2">Rank</th>
          <th className="p-2">Name</th>
          <th className="p-2">Price</th>
          <th className="p-2">1h %</th>
          <th className="p-2">24h %</th>
          <th className="p-2">7d %</th>
          <th className="p-2">Volume (24h)</th>
        </tr>
      </thead>
      <tbody>
        {symbols.map((symbol) => {
          const details = prices[symbol];
          return (
            <PriceRow 
              key={symbol} 
              symbol={symbol} 
              details={details} 
              onClick={() => onSelectCoin?.(symbol)}
            />
          );
        })}
      </tbody>
    </table>
  );
}