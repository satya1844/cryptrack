import WebSocket from "ws";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ws = new WebSocket(process.env.BINANCE_WS || 'wss://stream.binance.com:9443/ws/!ticker@arr');

ws.on("open", () => console.log("Connected to Binance"));

ws.on("message", async (data) => {
  try {
    const message = data.toString();
    const tickers = JSON.parse(message);

    // Publish the entire batch of tickers at once for the websocket server to process
    if (tickers.length > 0) {
      await redis.publish("prices:updates", message);
    }

    for (const ticker of tickers) {
      const symbol = ticker.s; // Symbol, e.g., BTCUSDT
      const price = ticker.c;  // Current price

      if (!symbol || !price) continue;

      // Still save the full data for each coin in the hash
      await redis.hset("prices", symbol, JSON.stringify({
        symbol,
        price,
        priceChange: ticker.p,
        high: ticker.h,
        low: ticker.l,
        volume: ticker.v,
        timestamp: Date.now()
      }));

      
    }
  } catch (err) {
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