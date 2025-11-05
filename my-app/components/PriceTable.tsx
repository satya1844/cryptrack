"use client";

import PriceRow from "./PriceRow";

export default function PriceTable({ prices }: { prices: Record<string, any> }) {
  // The data is now an array of the top 15 coins, already sorted by the server.
  // We can get the symbols directly from the keys of the prices object.
  const symbols = Object.keys(prices);

  if (symbols.length === 0) {
    return <div className="text-center p-4 text-white">Awaiting price data...</div>;
  }

  return (
    <table className="min-w-full bg-white border text-black border-gray-300">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="p-2">Rank</th>
          <th className="p-2">Name</th>
          <th className="p-2">Price</th>
          <th className="p-2">Change (24h)</th>
          <th className="p-2">Volume (24h)</th>
        </tr>
      </thead>
      <tbody>
        {symbols.map((symbol) => (
          <PriceRow key={symbol} symbol={symbol} details={prices[symbol]} />
        ))}
      </tbody>
    </table>
  );
}