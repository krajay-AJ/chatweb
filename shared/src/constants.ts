// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  REGISTER: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  MESSAGE: { windowMs: 60 * 1000, max: 30 }, // 30 messages per minute
  FILE_UPLOAD: { windowMs: 60 * 1000, max: 5 }, // 5 uploads per minute
  API_GENERAL: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'],
} as const;

// Message Limits
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 2000,
  MAX_FILE_SIZE: FILE_UPLOAD.MAX_SIZE,
  MAX_EDIT_TIME: 15 * 60 * 1000, // 15 minutes
  MAX_DELETE_TIME: 60 * 60 * 1000, // 1 hour
} as const;

// Conversation Limits
export const CONVERSATION_LIMITS = {
  MAX_PARTICIPANTS: 50,
  MAX_TITLE_LENGTH: 100,
  MESSAGE_HISTORY_LIMIT: 1000,
} as const;

// Presence Constants
export const PRESENCE = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  OFFLINE_THRESHOLD: 60000, // 1 minute
  TYPING_TIMEOUT: 3000, // 3 seconds
} as const;

// JWT Constants
export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'RS256',
} as const;

// Socket Constants
export const SOCKET = {
  CONNECT_TIMEOUT: 5000,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  MAX_LISTENERS: 20,
} as const;

// Cache TTL (Time To Live) Constants
export const CACHE_TTL = {
  USER_PRESENCE: 300, // 5 minutes
  USER_PROFILE: 3600, // 1 hour
  CONVERSATION_LIST: 1800, // 30 minutes
  MESSAGE_HISTORY: 7200, // 2 hours
  FILE_METADATA: 86400, // 24 hours
} as const;

// Database Constants
export const DATABASE = {
  CONNECTION_POOL_SIZE: 20,
  QUERY_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// Voice Call Constants
export const VOICE_CALL = {
  MAX_DURATION: 60 * 60 * 1000, // 1 hour
  RING_TIMEOUT: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // User Errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  
  // Conversation Errors
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  CONVERSATION_ACCESS_DENIED: 'CONVERSATION_ACCESS_DENIED',
  MAX_PARTICIPANTS_EXCEEDED: 'MAX_PARTICIPANTS_EXCEEDED',
  
  // Message Errors
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MESSAGE_EDIT_TIME_EXPIRED: 'MESSAGE_EDIT_TIME_EXPIRED',
  MESSAGE_DELETE_TIME_EXPIRED: 'MESSAGE_DELETE_TIME_EXPIRED',
  
  // File Upload Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  
  // System Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
} as const;

// Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Regular Expressions
export const REGEX = {
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;
