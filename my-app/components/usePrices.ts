"use client";
import { useEffect, useState } from "react";

export function usePrices() {
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("✅ WebSocket connection established");
      setLoading(false);
    };

    socket.onmessage = (event) => {
      try {
        const topCoins = JSON.parse(event.data);

        const newPrices = topCoins.reduce((acc: Record<string, any>, coin: any) => {
          if (coin && coin.symbol) {
            acc[coin.symbol] = coin;
          }
          return acc;
        }, {});

        setPrices(newPrices);

      } catch (err) {
        console.error("Failed to parse websocket message:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setLoading(false);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup function to close the socket when the component unmounts
    return () => {
      socket.close();
    };
  }, []); // The dependency array is now empty, so this effect runs only once.

  return { prices, loading };
}



