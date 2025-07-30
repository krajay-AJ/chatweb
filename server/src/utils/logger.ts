import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'anonymous-chat-server',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'test'
    }),

    // File transport for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      level: 'info'
    }),

    // Error file transport
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
      level: 'error'
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

// Create a stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Helper functions for structured logging
export const logWithContext = (level: string, message: string, context: any = {}) => {
  logger.log(level, message, { context });
};

export const logError = (error: Error, context: any = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    context,
    error: {
      name: error.name,
      message: error.message
    }
  });
};

export const logRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    statusCode: res.statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userId: req.user?.id,
    sessionId: req.sessionID
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

export const logSocketEvent = (eventName: string, userId?: string, socketId?: string, data?: any) => {
  logger.info('Socket Event', {
    event: eventName,
    userId,
    socketId,
    data: data ? JSON.stringify(data) : undefined
  });
};

export const logDatabaseQuery = (query: string, duration?: number, error?: Error) => {
  const logData = {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    duration: duration ? `${duration}ms` : undefined
  };

  if (error) {
    logger.error('Database Query Error', { ...logData, error: error.message });
  } else {
    logger.debug('Database Query', logData);
  }
};

// Performance logging
export const performanceLogger = {
  start: (operation: string) => {
    const startTime = process.hrtime.bigint();
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        logger.info('Performance', { operation, duration: `${duration.toFixed(2)}ms` });
        return duration;
      }
    };
  }
};

export default logger;
