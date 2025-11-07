## CrypTrack — Real‑time Crypto Tracker

Real‑time top coin prices streamed from Binance, enriched with CoinMarketCap metadata, broadcast over a local WebSocket server, and visualized in a Next.js app. Redis (via Docker) powers caching and pub/sub between processes.

### What I learned (experience report)

- WebSockets: worked with multiple sockets at once
	- Incoming stream from Binance (`!ticker@arr`) for live prices
	- Outgoing local WebSocket server on port 8080 to broadcast enriched data to the UI
- APIs and server vs client boundaries
	- CoinMarketCap (CMC) endpoints reject browser requests (CORS), so I proxied them through a Next.js API route and a server-side service
	- Learned to keep secrets server-side only (use `CMC_API_KEY`, not `NEXT_PUBLIC_*`)
- First time using Docker for Redis
	- Spun up Redis in seconds with one `docker run` command
	- Used Redis pub/sub (`prices:updates`) between the Binance listener and the WebSocket broadcaster
	- Stored CMC metadata in Redis so the WebSocket process can enrich streaming prices without re-hitting CMC

### Where I got stuck (and fixes)


- Sidebar not updating on click
	- Root cause: I normalized symbols (e.g., `BTC`), but the prices map is keyed by pairs (e.g., `BTCUSDT`)
	- Fix: pass the original symbol key from the table to the sidebar
- 500s from coin metadata endpoint
	- Multiple causes: bad symbol mapping, plan/rate-limit responses from CMC, and returning generic errors
	- Fix: improved API route logging and fallbacks; later simplified the UI to rely on the WebSocket-enriched metadata only (description and news removed)

---

## Project structure (high-level)

- `app/` — Next.js App Router UI and API routes
	- `api/market-data/route.ts` — server proxy for CMC global metrics (avoids CORS, keeps the key private)
- `components/` — UI components and hooks
	- `usePrices.ts` — connects to `ws://localhost:8080` for live data
	- `getData.ts` — fetches global market metrics via `/api/market-data`
	- `PriceTable.tsx` + `PriceRow.tsx` — interactive table; clicking a row selects the coin for the sidebar
- `services/` — Node processes run with `tsx`
	- `binance-listener.ts` — connects to Binance, publishes raw ticks to Redis channel `prices:updates`
	- `coinmarketcap-service.ts` — periodically fetches top coins from CMC and stores metadata in Redis (`cmc:metadata`)
	- `websocket-server.ts` — subscribes to `prices:updates`, enriches with CMC metadata, and broadcasts to the frontend on port `8080`

---

## Prerequisites

- Node.js 18+
- Docker Desktop (for Redis)
- A CoinMarketCap API key (free/pro)

---

## Clone and install

```powershell
# Clone
git clone https://github.com/satya1844/cryptrack.git
cd cryptrack/my-app

# Install deps
npm install
```

---

## Configure environment

Create `my-app/.env.local` with at least:

```env
CMC_API_KEY=your_coinmarketcap_api_key_here
REDIS_URL=redis://localhost:6379
# Optional: override Binance WS if needed
# BINANCE_WS=wss://stream.binance.com:9443/ws/!ticker@arr
```

Notes:
- Keep `CMC_API_KEY` server-side only (don’t prefix with `NEXT_PUBLIC_`).
- Restart the dev server after changing env vars.

---

## Start Redis (Docker)

```powershell
# Start Redis locally (first time)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# If Redis is already created but stopped
# docker start redis
```

---

## Run the stack (all processes)

You can run everything with one command (CMC service, Binance listener, WebSocket server, and Next.js):

```powershell
npm run start:all
```

Or run each in its own terminal if you prefer:

```powershell
# Terminal 1: CMC metadata refresher
npm run cmc

# Terminal 2: Binance stream listener -> publishes to Redis
npm run listener

# Terminal 3: Local WebSocket broadcaster (ws://localhost:8080)
npm run websocket

# Terminal 4: Next.js app (http://localhost:3000)
npm run dev
```

---

## How it works (runtime flow)

1. Binance listener receives live tickers and publishes raw batches to Redis (`prices:updates`).
2. CMC service refreshes top coin metadata every ~10 minutes and writes it to Redis (`cmc:metadata`).
3. WebSocket server subscribes to `prices:updates`, enriches entries with CMC metadata and broadcasts the top N to clients on `ws://localhost:8080`.
4. The Next.js app connects to the local WebSocket, renders the table, and shows coin details in the sidebar when a row is clicked.
5. Global market metrics are fetched via `/api/market-data` (server-side proxy to CMC) and displayed at the top.

---

## Troubleshooting

- Sidebar doesn’t update on click
	- Ensure the click handler passes the original table key (e.g., `BTCUSDT`) — this is already fixed in `PriceTable.tsx`.
- CORS errors when calling CMC
	- Always call CMC through the Next.js API route (e.g., `/api/market-data`), not from the browser directly.
- 500 errors from coin metadata (if you re-enable it)
	- Typically plan limits, invalid key, or rate limits. Keep API calls server-side and add logging.
- No data in the table
	- Confirm Redis is running and `npm run listener` + `npm run websocket` are started.
	- Check terminal logs for `📢 Successfully subscribed to 'prices:updates'.` and `Broadcasting top ...`

---

## Scripts

- `npm run dev` — Next.js dev server
- `npm run cmc` — CMC metadata refresher service
- `npm run listener` — Binance WebSocket listener service
- `npm run websocket` — Local WebSocket broadcaster
- `npm run start:all` — Run all of the above concurrently

---

## Notes

- Ports:
	- Next.js: `http://localhost:3000`
	- WebSocket: `ws://localhost:8080`
	- Redis: `redis://localhost:6379`
- The current UI shows price, changes, volume, and rank in the sidebar (description/news intentionally removed for simplicity).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


