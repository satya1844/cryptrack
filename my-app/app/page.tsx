"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    // const ws = new WebSocket(
    //   "wss://fstream.binance.com/stream?streams=btcusdt@markPrice"
    // );

    // ws.onmessage = (e) => {
    //   try {
    //     const msg = JSON.parse(e.data);
    //     const p = msg?.data?.p;
    //     if (p !== undefined) setPrice(Number(p));
    //     console.log(msg);
    //   } catch (err) {
    //     console.error("Failed to parse WS message", err);
    //   }
    // };

    // ws.onerror = (err) => console.error("WebSocket error", err);

    return () => {
      // ws.close();
    };
  }, []);

  return (
    <main>
      <h1>BTC/USDT Mark Price</h1>
      <p>{price !== null ? price : "Loading..."}</p>
    </main>
  );
}
