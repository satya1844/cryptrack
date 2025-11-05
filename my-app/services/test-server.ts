import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('🚀 Simple Test WebSocket server started on port 8080');

wss.on('connection', (ws) => {
  console.log('🤝 A client has connected to the test server.');
  ws.on('close', () => {
    console.log('👋 Client disconnected from the test server.');
  });
});

// This is our fake data, matching the structure the frontend expects
const fakeTopCoins = [
  { symbol: 'BTCUSDT', price: '99999.99', priceChange: '2.55', volume: '123456789', high: '100000', low: '98000' },
  { symbol: 'ETHUSDT', price: '5000.00', priceChange: '-1.23', volume: '98765432', high: '5100', low: '4900' },
];

// Every 2 seconds, we broadcast the fake data to all connected clients
setInterval(() => {
  if (wss.clients.size > 0) {
    const payload = JSON.stringify(fakeTopCoins);
    console.log(`📢 Broadcasting test data to ${wss.clients.size} client(s)...`);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}, 2000);
