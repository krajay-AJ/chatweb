import { createClient } from 'redis';
import { logger } from '../utils/logger';

export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const connectRedis = async (): Promise<typeof redisClient> => {
    try {
        await redisClient.connect();
        logger.info('✅ Redis connected successfully');
        return redisClient;
    } catch (error) {
        logger.warn('❌ Redis connection failed:', error);
        throw error;
    }
}; export const disconnectRedis = async (): Promise<void> => {
    try {
        await redisClient.disconnect();
        logger.info('Redis disconnected');
    } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
    }
};
