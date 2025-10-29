# Realtime Crypto Data — Implementation Guide

This document describes a minimal, production-ready architecture and step-by-step implementation to ingest Binance realtime data, cache it, and broadcast it to frontend clients using a single backend connection + Pub/Sub + SSE/WebSocket.

Overview
- Backend Listener: 1 persistent WebSocket to Binance that normalizes incoming messages and writes the latest state to Redis (or an in-memory cache).
- Distributor: Redis Pub/Sub (or direct in-process pubsub) and an HTTP endpoint (SSE or WebSocket) that pushes updates to connected clients.
- Frontend: Connects to the backend SSE/WebSocket endpoint to receive real-time updates.

Why this pattern
- Single Binance connection for stability and rate-limit friendliness.
- Redis centralizes state for horizontal scaling and history retrieval.
- SSE is simple and reliable for one-way updates; use WebSocket for bi-directional needs.

Environment & prerequisites
- Node 18+ / TypeScript
- Redis (local or managed)
- Required env vars (add to .env.local):
  - REDIS_URL=redis://localhost:6379
  - BINANCE_WS=wss://stream.binance.com:9443/ws/!ticker@arr (or symbol-specific)
  - PORT=3001

Files to add (suggested)
- services/binance-listener.ts — standalone Node process that connects to Binance, writes to Redis and publishes updates.
- services/sse-server.ts or Next.js API route — subscribes to Redis and streams to clients (SSE) or forwards via WebSocket.
- Optional: Dockerfile / PM2 config to run the listener as a separate process.

Quick architecture ASCII
Binance WSS -> Listener (Node) -> Redis (HSET + PUB) -> SSE / WebSocket -> Browser

Minimal example: Binance listener (standalone Node service)
- Stores latest price per symbol in Redis hash `prices`
- Publishes each update on channel `prices:updates`

```ts
// services/binance-listener.ts
import WebSocket from "ws";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
const ws = new WebSocket(process.env.BINANCE_WS || "wss://stream.binance.com:9443/ws/!ticker@arr");

ws.on("open", () => console.log("Connected to Binance"));
ws.on("message", async (data) => {
  try {
    const payload = JSON.parse(data.toString());
    // payload could be an array or object depending on stream; normalize to { symbol, price }
    // Example for ticker@arr: payload is array of tickers
    const tickers = Array.isArray(payload) ? payload : [payload];
    for (const t of tickers) {
      const symbol = t.s || t.symbol;        // Binance fields vary by stream
      const price = t.c || t.price;
      if (!symbol || !price) continue;
      // Save latest in Redis hash
      await redis.hset("prices", symbol, price.toString());
      // Publish update (compact payload)
      await redis.publish("prices:updates", JSON.stringify({ symbol, price }));
    }
  } catch (err) {
    console.error("Parse error", err);
  }
});

ws.on("close", () => {
  console.log("Binance socket closed — reconnecting in 3s");
  setTimeout(() => ws.terminate(), 3000);
});