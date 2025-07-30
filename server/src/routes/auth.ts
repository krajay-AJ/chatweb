import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/userService';
import { redisClient } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Rate limiting for auth endpoints
const authRateLimit = async (req: any, res: any, next: any) => {
    const ip = req.ip;
    const key = `auth_rate_limit:${ip}`;

    try {
        const attempts = await redisClient.incr(key);
        if (attempts === 1) {
            await redisClient.expire(key, 900); // 15 minutes
        }

        if (attempts > 5) {
            return res.status(429).json({
                error: 'Too many authentication attempts. Please try again later.'
            });
        }

        next();
    } catch (error) {
        logger.error('Rate limiting error:', error);
        next(); // Continue if Redis fails
    }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimit, async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                error: 'Username/email and password are required'
            });
        }

        // Find user
        const user = await UserService.findUserByIdentifier(identifier);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Verify password
        const isValidPassword = await UserService.verifyPassword(password, (user as any).password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Update last login
        await UserService.updateLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '7d' }
        );

        // Store session in Redis
        await redisClient.setEx(`session:${user.id}`, 604800, token); // 7 days

        logger.info(`User logged in successfully: ${user.username}`);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                gender: user.gender
            },
            token
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', authRateLimit, async (req, res) => {
    try {
        const { email, username, password, gender } = req.body;

        // Validation
        if (!email || !username || !password || !gender) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        if (!email.includes('@')) {
            return res.status(400).json({
                error: 'Please enter a valid email address'
            });
        }

        // Create user
        const user = await UserService.createUser({
            email,
            username,
            password,
            gender
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '7d' }
        );

        // Store session in Redis
        await redisClient.setEx(`session:${user.id}`, 604800, token); // 7 days

        logger.info(`User registered successfully: ${username}`);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                gender: user.gender
            },
            token
        });
    } catch (error: any) {
        logger.error('Register error:', error);

        if (error.message === 'Email already exists' || error.message === 'Username already exists') {
            return res.status(409).json({ error: error.message });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

export default router;
