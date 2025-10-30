"use client";
import { useEffect, useState } from "react";

export function usePrices() {
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try{
        const res = await fetch('/api/prices');
        const data = await res.json();
        setPrices(data);
        setLoading(false);
      }catch (err){
        console.error("Failed to fetch prices", err);
      }
    }

    fetchPrices();

    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [])

  return { prices, loading };

}


