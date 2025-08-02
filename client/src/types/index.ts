// Common types for the application
export interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: string;
    type: 'text' | 'system' | 'whisbot';
}

export interface User {
    email: string;
    password: string;
    username: string;
    gender: string;
}

export interface CallState {
    state: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';
    duration: number;
    startTime: Date | null;
    isEncrypted: boolean;
    audioQuality: 'good' | 'poor' | 'unknown';
}
