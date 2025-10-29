import WebSocket from "ws";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ws = new WebSocket(process.env.BINANCE_WS || 'wss://stream.binance.com:9443/ws/!ticker@arr');

// ws.on("message", (data) => {
//   const message = data.toString();
//   const trade = JSON.parse(message);
//   console.log(trade);
//   // Store the trade data in Redis
//   redis.lpush("binance_trades", JSON.stringify(trade));
// });

// ws.on("error", (error) => {
//   console.error("WebSocket error:", error);
// });
ws.on("open", () => console.log("Connected to Binance"));

ws.on("message", async (data) => {
  try {
  const message = data.toString();
  const tickers = JSON.parse(message);

  for (const ticker of tickers) {
    const symbol = ticker.s; // Symbol, e.g., BTCUSDT
    const price = ticker.c;  // Current price
    const priceChange = ticker.p; // Price change

    if (!symbol || !price) continue;

    await redis.hset("prices", symbol, JSON.stringify({
      symbol,
      price,
      priceChange,
      high: ticker.h,
      low: ticker.l,
      volume: ticker.v,
      timestamp: Date.now()
    }));

    //publish to subscribers 
    await redis.publish("prices:updates", JSON.stringify({
      symbol,
      price,
      priceChange,
    }));
          console.log(`📊 ${symbol}: $${price} (${priceChange}%)`);

  }
  }catch (err) {
    console.error("❌ Parse error:", err);
  }
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);

});

ws.on("close", () => {
  console.log("⚠️ Binance socket closed — reconnecting in 3s");
  setTimeout(() => {
    console.log("🔄 Restarting...");
    process.exit(1); // Let PM2/Docker restart it
  }, 3000);
});

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  ws.close();
  await redis.quit();
  process.exit(0);
});