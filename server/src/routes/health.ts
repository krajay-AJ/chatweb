import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 */
router.get('/', async (req, res) => {
    try {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with system information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed system health information
 */
router.get('/detailed', async (req, res) => {
    try {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            memory: process.memoryUsage(),
            version: process.version,
            // Add more detailed checks here (database, redis, etc.)
        });
    } catch (error) {
        logger.error('Detailed health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;
