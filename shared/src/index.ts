// Core Types
export interface User {
  id: string;
  username: string;
  displayName: string;
  gender: UserGender;
  isAnonymous: boolean;
  isActive: boolean;
  lastSeen: Date;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  messages: boolean;
  mentions: boolean;
  sounds: boolean;
  desktop: boolean;
  push: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showTyping: boolean;
  showReadReceipts: boolean;
  allowFileSharing: boolean;
  allowVoiceCalls: boolean;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: MessageMetadata;
  replyTo?: string;
  editedAt?: Date;
  deletedAt?: Date;
  timestamp: Date;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  SYSTEM = 'system'
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number; // for voice messages
  dimensions?: { width: number; height: number }; // for images
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: string[];
  type: ConversationType;
  title?: string;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  username?: string;
  password?: string;
  gender: UserGender;
  isAnonymous?: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName: string;
  gender: UserGender;
}

// Socket Events
export enum SocketEvent {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  
  // Messages
  MESSAGE_SEND = 'message:send',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_UPDATE = 'message:update',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_REACTION = 'message:reaction',
  
  // Typing
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  
  // Presence
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  USER_PRESENCE = 'user:presence',
  
  // Conversations
  CONVERSATION_JOIN = 'conversation:join',
  CONVERSATION_LEAVE = 'conversation:leave',
  CONVERSATION_UPDATE = 'conversation:update',
  
  // Voice Calls
  CALL_INITIATE = 'call:initiate',
  CALL_ACCEPT = 'call:accept',
  CALL_REJECT = 'call:reject',
  CALL_END = 'call:end',
  CALL_SIGNAL = 'call:signal'
}

// Presence Types
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  isTyping?: boolean;
  conversationId?: string;
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// File Upload Types
export interface FileUpload {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

// Voice Call Types
export interface VoiceCall {
  id: string;
  conversationId: string;
  initiator: string;
  participants: string[];
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
}

export enum CallStatus {
  INITIATING = 'initiating',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended',
  REJECTED = 'rejected',
  MISSED = 'missed'
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    fileStorage: ServiceHealth;
  };
  version: string;
  uptime: number;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

// Export all modules
export * from './constants';
export * from './utils';
