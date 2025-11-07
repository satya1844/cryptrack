import { WebSocketServer, WebSocket } from 'ws';
import Redis from "ioredis";

interface CoinMetadata {
  name: string;
  symbol: string;
  logo: string;
  marketCap: number;
  rank: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  percentChange30d: number;
}

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ port: 8080 });
console.log('🚀 WebSocket server started on port 8080');

wss.on('connection', (ws) => {
  console.log('🤝 New client connected');
  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });
});

// --- Redis Setup ---
// We need TWO Redis clients:
// 1. One for subscribing (pub/sub mode)
// 2. One for regular commands (get, set, etc.)
const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Store CMC metadata in memory
let cmcMetadata: Map<string, CoinMetadata> = new Map();

// Load CMC metadata from Redis
async function loadCMCMetadata() {
  try {
    const stored = await redisClient.get('cmc:metadata'); // Use redisClient, not subscriber
    if (stored) {
      const entries = JSON.parse(stored);
      cmcMetadata = new Map(entries);
      console.log(`📥 Loaded metadata for ${cmcMetadata.size} coins from CMC`);
    }
  } catch (error) {
    console.error('❌ Error loading CMC metadata:', error);
  }
}

// Load metadata on startup
loadCMCMetadata();

// Reload metadata every 10 minutes
setInterval(loadCMCMetadata, 10 * 60 * 1000);

redisSubscriber.subscribe("prices:updates", (err) => {
  if (err) {
    console.error("Failed to subscribe to Redis:", err);
  } else {
    console.log("📢 Successfully subscribed to 'prices:updates'.");
  }
});

redisSubscriber.on("message", (channel, message) => {
  if (channel !== "prices:updates") return;

  let priceUpdate;
  try {
    priceUpdate = JSON.parse(message);
  } catch (err) {
    console.error("Parse error:", err);
    return;
  }

  if (!Array.isArray(priceUpdate)) {
    console.warn("Expected an Array, got:", typeof priceUpdate);
    return;
  }
  
  // Filter and enrich with CMC metadata
  // Use a Map to ensure only one entry per base symbol
  const coinMap = new Map<string, any>();
  
  for (const coin of priceUpdate) {
    // Extract base symbol from trading pair (e.g., "BTCUSDT" -> "BTC")
    const symbol = coin.s.replace(/USDT$|BUSD$|USDC$/i, '');
    const metadata = cmcMetadata.get(symbol);
    
    // Only include coins that are in CMC top 100
    if (!metadata) continue;
    
    // Prefer USDT pairs over others (they usually have higher volume)
    const isUSDT = coin.s.endsWith('USDT');
    const existing = coinMap.get(symbol);
    
    // If we don't have this coin yet, or if this is a USDT pair and the existing isn't
    if (!existing || (isUSDT && !existing.symbol.endsWith('USDT'))) {
      coinMap.set(symbol, {
        symbol: coin.s,
        baseSymbol: symbol,
        name: metadata.name,
        logo: metadata.logo,
        rank: metadata.rank,
        marketCap: metadata.marketCap,
        price: coin.c,
        priceChange: coin.P, // Uppercase P = percentage change (24h)
        percentChange1h: metadata.percentChange1h,
        percentChange24h: metadata.percentChange24h,
        percentChange7d: metadata.percentChange7d,
        percentChange30d: metadata.percentChange30d,
        volume: coin.v,
        high: coin.h,
        low: coin.l,
      });
    }
  }
  
  // Convert Map to array and sort by market cap rank
  const enrichedCoins = Array.from(coinMap.values())
    .sort((a, b) => a.rank - b.rank) // Sort by market cap rank
    .slice(0, 15); // Top 15

  if (enrichedCoins.length > 0) {
    console.log(`Broadcasting top ${enrichedCoins.length} coins to ${wss.clients.size} clients.`);

    const payload = JSON.stringify(enrichedCoins);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
});
