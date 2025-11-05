"use client";

import { memo } from 'react';
import Image from 'next/image';

interface PriceRowProps {
  symbol: string;
  details: {
    name?: string;
    logo?: string;
    rank?: number;
    baseSymbol?: string;
    price: string;
    priceChange: string;
    volume: string;
    [key: string]: any;
  };
}

function PriceRow({ symbol, details }: PriceRowProps) {
  const priceValue = parseFloat(details.price);
  
  // Format price intelligently based on its size
  let formattedPrice: string;
  if (priceValue >= 1) {
    formattedPrice = priceValue.toFixed(2);
  } else if (priceValue >= 0.01) {
    formattedPrice = priceValue.toFixed(4);
  } else if (priceValue > 0) {
    formattedPrice = priceValue.toFixed(8);
  } else {
    formattedPrice = '0.00';
  }

  const priceChange = parseFloat(details.priceChange);
  const volume = parseFloat(details.volume).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const changeColor = priceChange > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <tr className="border-t border-gray-200 hover:bg-gray-50">
      <td className="p-2 text-center font-bold text-gray-600">#{details.rank || '?'}</td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          {details.logo && (
            <Image 
              src={details.logo} 
              alt={details.name || symbol} 
              width={32} 
              height={32}
              className="rounded-full"
            />
          )}
          <div>
            <div className="font-bold text-black">{details.name || symbol}</div>
            <div className="text-xs text-gray-500">{details.baseSymbol || symbol}</div>
          </div>
        </div>
      </td>
      <td className="p-2 font-semibold text-black">{`$${formattedPrice}`}</td>
      <td className={`p-2 font-semibold ${changeColor}`}>{`${priceChange.toFixed(2)}%`}</td>
      <td className="p-2 text-black">{`$${volume}`}</td>
    </tr>
  );
}

export default memo(PriceRow);
