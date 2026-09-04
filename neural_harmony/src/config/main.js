/**
 * Конфигурация приложения NEURAL_HARMONY
 * @author NEURAL_ARCHITECT_PREMIUM++
 */

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_harmony',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Security
  jwt: {
    secret: process.env.JWT_SECRET || 'neural-harmony-secret-key-2024',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB
    path: process.env.UPLOAD_PATH || './public/uploads',
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  },
  
  // AI Services
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
      maxTokens: 2048
    },
    tensorflow: {
      modelPath: process.env.TENSORFLOW_MODEL_PATH || './models',
    },
    sentiment: {
      language: 'ru',
      threshold: 0.5
    }
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: 'NEURAL_HARMONY <noreply@neural-harmony.corp>'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },
  
  // WebSocket
  websocket: {
    path: process.env.WS_PATH || '/socket.io',
    pingInterval: 25000,
    pingTimeout: 60000
  },
  
  // API
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: '/api'
  },
  
  // Company
  company: {
    name: process.env.COMPANY_NAME || 'Neural Harmony Corp',
    domain: process.env.COMPANY_DOMAIN || 'neural-harmony.corp'
  },
  
  // Logo
  logo: {
    text: process.env.LOGO_TEXT || 'NEURAL_ARCHITECT_PREMIUM++',
    symbol: process.env.LOGO_SYMBOL || '🦢'
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'neural-harmony-session-secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000 // 24 hours
  },
  
  // Games
  games: {
    maxConcurrent: 1000,
    timeout: 300000, // 5 minutes
    ratingSystem: 'elo'
  },
  
  // Notifications
  notifications: {
    maxPerUser: 100,
    expiryDays: 30
  },
  
  // Cache
  cache: {
    ttl: 3600, // 1 hour
    prefix: 'nh:'
  }
};
