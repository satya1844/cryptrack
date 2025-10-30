"use client";
import { usePrices } from "../components/usePrices";
import PriceTable from "../components/PriceTable";
import React, { useState, useEffect } from "react";

export default function Home() {

const { prices, loading } = usePrices();

return (
  <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Crypto Prices</h1>
      {loading ? <p>Loading...</p> : <PriceTable prices={prices} />}
    </div>
  );
}





// export default function Home() {
//   const [price, setPrice] = useState<number | null>(null);

//   useEffect(() => {
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

    // return () => {
      // ws.close();
    // };
  // }, []);

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-100">
//       <h1 className="text-3xl font-bold text-amber-950">BTC/USDT Mark Price</h1>
      
//     </main>
//   );
// }
