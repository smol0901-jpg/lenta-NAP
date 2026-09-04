/**
 * NEURAL_HARMONY - Корпоративная социальная сеть с ИИ
 * Точка входа сервера
 * 
 * @author NEURAL_ARCHITECT_PREMIUM++
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Server } = require('socket.io');

// Import configurations
const config = require('./config/main');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const gameRoutes = require('./routes/games');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import socket handlers
const socketHandlers = require('./sockets/handlers');

// Import AI services
const aiService = require('./services/aiService');
const botManager = require('./bots/manager');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: process.env.WS_PATH || '/socket.io'
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  const logStream = require('./utils/logger').stream;
  app.use(morgan('combined', { stream: logStream }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/users`, userRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/posts`, postRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/messages`, messageRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/groups`, groupRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/games`, gameRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/ai`, aiRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/upload`, uploadRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/admin`, adminRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NEURAL_HARMONY',
    version: '1.0.0'
  });
});

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_harmony', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('✅ MongoDB connected successfully');
})
.catch(err => {
  logger.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);
  
  // Initialize socket handlers
  socketHandlers(io, socket);
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Initialize AI services
aiService.initialize()
  .then(() => {
    logger.info('✅ AI services initialized');
  })
  .catch(err => {
    logger.error('❌ AI services initialization error:', err);
  });

// Initialize bots
botManager.start()
  .then(() => {
    logger.info('✅ Bots started');
  })
  .catch(err => {
    logger.error('❌ Bots startup error:', err);
  });

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🦢 NEURAL_HARMONY - Corporate Social Network           ║
║   Powered by NEURAL_ARCHITECT_PREMIUM++                  ║
║                                                           ║
║   Server running on port ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   API Version: ${process.env.API_VERSION || 'v1'}                                  ║
║                                                           ║
║   Ready to improve employee morale! 🚀                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
