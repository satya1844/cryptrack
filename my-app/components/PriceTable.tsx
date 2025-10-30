"use client";

import PriceRow from "./PriceRow";

export default function PriceTable({ prices }: { prices: Record<string, any> }) {
  const symbols = Object.keys(prices);

  return (
    <table className="min-w-full bg-white border text-black border-gray-300">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="p-2">Symbol</th>
          <th className="p-2">Price</th>
        </tr>
      </thead>
      <tbody>
        {symbols.map((symbol) => (
          <PriceRow key={symbol} symbol={symbol} details={prices[symbol]} />
        ))}
      </tbody>
    </table>

  )


}