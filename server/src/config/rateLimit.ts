import rateLimit from 'express-rate-limit';

export const rateLimitConfig = {
  // General API rate limiting
  general: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per windowMs
    message: {
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Fix trust proxy issue for local development
    keyGenerator: (req) => {
      return req.ip || 'anonymous';
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.'
        }
      });
    }
  }),

  // Authentication endpoints (more restrictive)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: true,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts, please try again later.'
        }
      });
    }
  }),

  // Message sending (to prevent spam)
  message: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: {
      error: 'Too many messages, please slow down.',
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
          message: 'Too many messages, please slow down.'
        }
      });
    }
  }),

  // File upload limiting
  fileUpload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: {
      error: 'Too many file uploads, please wait before uploading again.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          message: 'Too many file uploads, please wait before uploading again.'
        }
      });
    }
  }),

  // Registration (very restrictive)
  register: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: {
      error: 'Too many account creation attempts, please try again later.',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED'
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'REGISTER_RATE_LIMIT_EXCEEDED',
          message: 'Too many account creation attempts, please try again later.'
        }
      });
    }
  })
};
