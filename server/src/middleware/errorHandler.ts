import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    // Don't expose error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : error.message;

    res.status(error.status || 500).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
