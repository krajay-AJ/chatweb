import { PrismaClient } from '@prisma/client';
import { MongoClient, Db } from 'mongodb';
import { createClient } from 'redis';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

// PostgreSQL with Prisma for user management and authentication
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// PostgreSQL pool for direct queries
export const pgPool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'chatweb',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'mysecretpassword',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// MongoDB for flexible message storage and chat history
let mongoDb: Db;
let mongoClient: MongoClient;

// Redis for sessions, caching, and real-time features
export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const connectMongo = async (): Promise<Db> => {
    if (mongoDb) return mongoDb;

    try {
        mongoClient = new MongoClient(
            process.env.MONGODB_URL || 'mongodb://localhost:27017/chatweb_messages'
        );
        await mongoClient.connect();
        mongoDb = mongoClient.db('chatweb_messages');
        logger.info('✅ MongoDB connected successfully');
        return mongoDb;
    } catch (error) {
        logger.warn('❌ MongoDB connection failed:', error);
        throw error;
    }
};

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        logger.info('✅ Redis connected successfully');
    } catch (error) {
        logger.warn('❌ Redis connection failed:', error);
        throw error;
    }
};

export const connectDatabase = async (): Promise<void> => {
    try {
        // Connect PostgreSQL
        await prisma.$connect();
        logger.info('✅ PostgreSQL connected successfully');

        // Connect MongoDB
        await connectMongo();

        // Connect Redis
        await connectRedis();

    } catch (error) {
        logger.warn('❌ Database connection failed, continuing without database:', error);
        // Don't exit in development - allow the server to start without database
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}; export const disconnectDatabase = async (): Promise<void> => {
    try {
        // Disconnect PostgreSQL
        await prisma.$disconnect();
        logger.info('PostgreSQL disconnected');

        // Disconnect MongoDB
        if (mongoClient) {
            await mongoClient.close();
            logger.info('MongoDB disconnected');
        }

        // Disconnect Redis
        if (redisClient.isOpen) {
            await redisClient.disconnect();
            logger.info('Redis disconnected');
        }
    } catch (error) {
        logger.error('Error disconnecting from databases:', error);
    }
};

// Export MongoDB instance for use in other modules
export const getMongoDB = (): Db => {
    if (!mongoDb) {
        throw new Error('MongoDB not connected. Call connectMongo() first.');
    }
    return mongoDb;
};
