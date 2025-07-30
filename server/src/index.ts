import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';

// Import configurations and middleware
import { corsConfig } from './config/cors';
import { rateLimitConfig } from './config/rateLimit';
import { sessionConfig } from './config/session';
import { setupSwagger } from './config/swagger';
import { logger } from './utils/logger';
import { connectDatabase, redisClient } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import otpRoutes from './routes/otp';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';
import healthRoutes from './routes/health';

// Import socket handlers
import { setupSocketHandlers } from './socket';

// Load environment variables
dotenv.config();

class App {
  private app: express.Application;
  private server: any;
  private io!: SocketServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
  }

  private async initialize() {
    await this.initializeDatabase();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocket();
    this.initializeErrorHandling();
  }

  private async initializeDatabase() {
    try {
      await connectDatabase();
    } catch (error) {
      logger.warn('Database initialization failed:', error);
    }
  }

  private initializeMiddleware() {
    // Trust proxy for ngrok and other reverse proxies
    this.app.set('trust proxy', true);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors(corsConfig));

    // Rate limiting
    this.app.use('/api', rateLimitConfig.general);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Session management (only if Redis is available)
    if (redisClient?.isOpen) {
      this.app.use(session({
        store: new RedisStore({ client: redisClient }),
        ...sessionConfig,
      }));
    } else {
      this.app.use(session(sessionConfig));
    }

    // Serve uploaded files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Swagger documentation
    setupSwagger(this.app);
  }

  private initializeRoutes() {
    // Root route - basic welcome message
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Anonymous Chat Platform API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          docs: '/api-docs'
        }
      });
    });

    // Health check (no auth required)
    this.app.use('/health', healthRoutes);

    // API routes
    const apiRouter = express.Router();

    // Public routes
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/otp', otpRoutes);

    // Protected routes
    apiRouter.use('/users', authMiddleware, userRoutes);
    apiRouter.use('/conversations', authMiddleware, conversationRoutes);
    apiRouter.use('/messages', authMiddleware, messageRoutes);
    apiRouter.use('/files', authMiddleware, fileRoutes);

    this.app.use('/api', apiRouter);

    // Serve React app in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../../client/build')));
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
      });
    }
  }

  private initializeSocket() {
    this.io = new SocketServer(this.server, {
      cors: corsConfig,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    setupSocketHandlers(this.io);
  }

  private initializeErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  private async gracefulShutdown() {
    logger.info('Starting graceful shutdown...');

    // Close server
    this.server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connections
    try {
      if (redisClient?.isOpen) {
        await redisClient.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }

    // Exit process
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }

  public async start() {
    try {
      // Initialize the application
      await this.initialize();
      logger.info('Application initialized successfully');

      // Start server
      const PORT = process.env.PORT || 3001;
      this.server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new App();
app.start().catch((error) => {
  logger.error('Application failed to start:', error);
  process.exit(1);
});

export default app;
