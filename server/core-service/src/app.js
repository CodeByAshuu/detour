require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const coreRoutes = require('./routes/core.routes');

const app = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so controllers can emit via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Agent joins its own room so dispatcher can target messages
  socket.on('agent:join', ({ agentId }) => {
    socket.join(`agent:${agentId}`);
    console.log(`[Socket] Agent ${agentId} joined room agent:${agentId}`);
  });

  // Agent sends live location ping → broadcast to dispatcher room
  socket.on('agent:location', ({ agentId, coordinates }) => {
    io.to('dispatchers').emit('agent:location', { agentId, coordinates, ts: Date.now() });
  });

  // Dispatchers join their room
  socket.on('dispatcher:join', () => {
    socket.join('dispatchers');
    console.log(`[Socket] Dispatcher joined: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── HTTP Middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use('/api/core', coreRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'core-service' });
});

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;
if (require.main === module) {
  connectDB().then(() => {
    server.listen(PORT, () => {
      console.log(`Core service running on port ${PORT}`);
    });
  });
}

module.exports = { app, server, io };
