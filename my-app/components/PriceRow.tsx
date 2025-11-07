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
    percentChange1h?: number;
    percentChange24h?: number;
    percentChange7d?: number;
    percentChange30d?: number;
    volume: string;
    [key: string]: any;
  };
  onClick?: () => void;
}

function PriceRow({ symbol, details, onClick }: PriceRowProps) {
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
  const change1h = details.percentChange1h || 0;
  const change24h = details.percentChange24h || 0;
  const change7d = details.percentChange7d || 0;
  const volume = parseFloat(details.volume).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Debug: Log the values to see what we're receiving
 

  const getChangeColor = (change: number) => change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <tr className="border-t border-border hover:bg-[#373330] cursor-pointer" onClick={onClick}>
      <td className="p-2 text-center  text-foreground font-medium ">{details.rank || '?'}</td>
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
            <div className="font-extrabold text-secondary-foreground">{details.name || symbol}</div>
            <div className="text-xs text-secondary-text">{details.baseSymbol || symbol}</div>
          </div>
        </div>
      </td>
      <td className="p-2 font-normal text-secondary-foreground">{`$${formattedPrice}`}</td>
      <td className={`p-2 font-medium  ${getChangeColor(change1h)}`}>{formatChange(change1h)}</td>
      <td className={`p-2 font-medium  ${getChangeColor(change24h)}`}>{formatChange(change24h)}</td>
      <td className={`p-2 font-medium  ${getChangeColor(change7d)}`}>{formatChange(change7d)}</td>
      <td className="p-2 text-secondary-text">{`$${volume}`}</td>
    </tr>
  );
}

export default memo(PriceRow);
