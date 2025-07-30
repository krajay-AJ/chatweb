import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token.',
        });
    }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            req.user = decoded;
        }

        next();
    } catch (error) {
        // For optional auth, we just continue without setting req.user
        next();
    }
};
