const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ── Socket.io ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Track connected clients
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  io.emit('userCount', io.engine.clientsCount);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    io.emit('userCount', io.engine.clientsCount);
  });
});

// Make io accessible in routes via app.locals
app.locals.io = io;

// ── Security & Parsing Middleware ───────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// ── Routes ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ── Database Connection & Server Start ──────────────────────
const startServer = async () => {
  let mongoUri = process.env.MONGO_URI;

  try {
    // Try connecting to local/remote MongoDB first
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    // If local MongoDB is not available, use in-memory MongoDB
    console.log('⚠️  Local MongoDB not found. Starting in-memory MongoDB Replica Set...');
    try {
      const { MongoMemoryReplSet } = require('mongodb-memory-server');
      const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('✅ In-memory MongoDB started successfully');
      console.log('📝 Note: Data will be lost when server stops. Use "POST /api/seed" to populate data.');
    } catch (memErr) {
      console.error('❌ Failed to start any MongoDB:', memErr.message);
      process.exit(1);
    }
  }

  // Use server.listen instead of app.listen for Socket.io
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready for real-time connections`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = { app, server, io, mongoose };
