import Redis from "ioredis";
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface CMCCoin {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      market_cap: number;
      volume_24h: number;
      percent_change_24h: number;
    };
  };
}

interface CoinMetadata {
  name: string;
  symbol: string;
  logo: string;
  marketCap: number;
  rank: number;
}

const CMC_API_KEY = process.env.CMC_API_KEY || '';
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1';

// Store coin metadata in memory
let coinMetadataMap: Map<string, CoinMetadata> = new Map();

/**
 * Fetches top coins from CoinMarketCap and stores metadata in Redis
 */
async function fetchTopCoins() {
  try {
    console.log('📊 Fetching top coins from CoinMarketCap...');

    const response = await fetch(
      `${CMC_API_URL}/cryptocurrency/listings/latest?limit=100&convert=USD`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CMC API error: ${response.status}`);
    }

    const data = await response.json();
    const coins: CMCCoin[] = data.data;

    console.log(`✅ Fetched ${coins.length} coins from CoinMarketCap`);

    // Clear the old map
    coinMetadataMap.clear();

    // Process each coin
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      const metadata: CoinMetadata = {
        name: coin.name,
        symbol: coin.symbol,
        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        marketCap: coin.quote.USD.market_cap,
        rank: i + 1,
      };

      // Store by symbol (e.g., "BTC", "ETH")
      coinMetadataMap.set(coin.symbol, metadata);
    }

    // Store the metadata map in Redis for the websocket server to use
    await redis.set('cmc:metadata', JSON.stringify(Array.from(coinMetadataMap.entries())));
    
    console.log(`💾 Stored metadata for ${coinMetadataMap.size} coins in Redis`);

  } catch (error) {
    console.error('❌ Error fetching from CoinMarketCap:', error);
  }
}

/**
 * Gets coin metadata by symbol from memory
 */
export function getCoinMetadata(symbol: string): CoinMetadata | undefined {
  return coinMetadataMap.get(symbol);
}

/**
 * Loads metadata from Redis on startup
 */
async function loadMetadataFromRedis() {
  try {
    const stored = await redis.get('cmc:metadata');
    if (stored) {
      const entries = JSON.parse(stored);
      coinMetadataMap = new Map(entries);
      console.log(`📥 Loaded metadata for ${coinMetadataMap.size} coins from Redis`);
    }
  } catch (error) {
    console.error('❌ Error loading metadata from Redis:', error);
  }
}

/**
 * Starts the CoinMarketCap service
 */
async function startCMCService() {
  console.log('🚀 Starting CoinMarketCap service...');
  
  if (!CMC_API_KEY) {
    console.warn('⚠️  No CMC_API_KEY found. Please set it in your .env.local file');
    return;
  }

  // Load existing metadata from Redis
  await loadMetadataFromRedis();

  // Fetch immediately
  await fetchTopCoins();

  // Refresh every 10 minutes (CoinMarketCap free tier allows ~333 calls/day)
  setInterval(fetchTopCoins, 10 * 60 * 1000);
}

// Start the service
startCMCService();

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down CMC service...');
  await redis.quit();
  process.exit(0);
});
