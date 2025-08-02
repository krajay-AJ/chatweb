import { Socket } from 'socket.io-client';
import Peer from 'simple-peer';

// Type definitions
export interface VoiceCallConfig {
    iceServers: RTCIceServer[];
    constraints: MediaStreamConstraints;
    callTimeout: number;
    reconnectAttempts: number;
}

export interface CallEvent {
    type: 'call_initiated' | 'call_received' | 'call_accepted' | 'call_rejected' | 'call_ended' | 'call_error' | 'stream_received' | 'peer_connected';
    data?: any;
}

export type CallEventListener = (event: CallEvent) => void;

// Default configuration
export const defaultVoiceCallConfig: VoiceCallConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
    constraints: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1
        },
        video: false
    },
    callTimeout: 30000,
    reconnectAttempts: 3
};

// VoiceCallService class
class VoiceCallService {
    private static _instance: VoiceCallService;
    
    private socket: Socket | null = null;
    private peer: Peer.Instance | null = null;
    private localStream: MediaStream | null = null;
    private config: VoiceCallConfig;
    private eventListeners: CallEventListener[] = [];
    private isInitiator = false;
    private currentCallId: string | null = null;
    private reconnectCount = 0;

    private constructor(config: Partial<VoiceCallConfig> = {}) {
        this.config = { ...defaultVoiceCallConfig, ...config };
    }

    public static getInstance(config: Partial<VoiceCallConfig> = {}): VoiceCallService {
        if (!VoiceCallService._instance) {
            VoiceCallService._instance = new VoiceCallService(config);
        }
        return VoiceCallService._instance;
    }

    public static get instance(): VoiceCallService {
        return VoiceCallService.getInstance();
    }

    public static checkBrowserSupport(): { supported: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!navigator.mediaDevices) {
            errors.push('navigator.mediaDevices not available');
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            errors.push('getUserMedia not supported');
        }

        if (!window.RTCPeerConnection) {
            errors.push('WebRTC not supported');
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            errors.push('Requires HTTPS or localhost');
        }

        return {
            supported: errors.length === 0,
            errors
        };
    }

    initialize(socket: Socket): void {
        this.socket = socket;
        this.setupSocketListeners();
    }

    addEventListener(listener: CallEventListener): void {
        this.eventListeners.push(listener);
    }

    removeEventListener(listener: CallEventListener): void {
        const index = this.eventListeners.indexOf(listener);
        if (index > -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    private emitEvent(event: CallEvent): void {
        this.eventListeners.forEach(listener => listener(event));
    }

    private setupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.on('incoming_call', (data) => {
            this.emitEvent({ type: 'call_received', data });
        });

        this.socket.on('call_accepted', (data) => {
            this.emitEvent({ type: 'call_accepted', data });
        });

        this.socket.on('call_rejected', (data) => {
            this.emitEvent({ type: 'call_rejected', data });
        });

        this.socket.on('call_ended', (data) => {
            this.endCall();
            this.emitEvent({ type: 'call_ended', data });
        });

        this.socket.on('call_signal', (data) => {
            if (this.peer && data.signalData) {
                this.peer.signal(data.signalData);
            }
        });

        this.socket.on('call_error', (data) => {
            this.emitEvent({ type: 'call_error', data });
        });
    }

    private async getUserMedia(): Promise<MediaStream> {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support voice calls. Please use Chrome, Firefox, or Safari.');
            }

            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                throw new Error('Voice calls require HTTPS or localhost. Please use a secure connection.');
            }

            const stream = await navigator.mediaDevices.getUserMedia(this.config.constraints);
            this.localStream = stream;
            return stream;
        } catch (error: any) {
            console.error('Error accessing user media:', error);

            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone access denied. Please grant permission and try again.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Microphone is already in use by another application.');
            } else if (error.name === 'OverconstrainedError') {
                throw new Error('Microphone does not meet the required specifications.');
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Could not access microphone. Please check permissions and try again.');
            }
        }
    }

    private createPeer(isInitiator: boolean, stream: MediaStream): Peer.Instance {
        const peer = new Peer({
            initiator: isInitiator,
            trickle: false,
            stream: stream,
            config: {
                iceServers: this.config.iceServers
            }
        });

        peer.on('signal', (data) => {
            if (this.socket && this.currentCallId) {
                this.socket.emit('call_signal', {
                    targetUserId: this.currentCallId,
                    signalData: data
                });
            }
        });

        peer.on('stream', (remoteStream) => {
            this.emitEvent({ type: 'stream_received', data: remoteStream });
        });

        peer.on('connect', () => {
            this.emitEvent({ type: 'peer_connected' });
        });

        peer.on('error', (error) => {
            console.error('Peer error:', error);
            if (this.reconnectCount < this.config.reconnectAttempts) {
                this.reconnectCount++;
                console.log(`Attempting to reconnect (${this.reconnectCount}/${this.config.reconnectAttempts})...`);
                setTimeout(() => this.attemptReconnect(), 1000 * this.reconnectCount);
            } else {
                this.emitEvent({
                    type: 'call_error',
                    data: { message: 'Connection failed after multiple attempts' }
                });
                this.endCall();
            }
        });

        peer.on('close', () => {
            this.endCall();
        });

        return peer;
    }

    private async attemptReconnect(): Promise<void> {
        try {
            if (this.localStream && this.currentCallId) {
                this.peer = this.createPeer(this.isInitiator, this.localStream);
            }
        } catch (error) {
            console.error('Reconnection failed:', error);
            this.emitEvent({
                type: 'call_error',
                data: { message: 'Reconnection failed' }
            });
        }
    }

    async initiateCall(targetUserId: string): Promise<void> {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        try {
            this.currentCallId = targetUserId;
            this.isInitiator = true;
            this.reconnectCount = 0;

            const stream = await this.getUserMedia();
            this.peer = this.createPeer(true, stream);

            this.socket.emit('initiate_call', { targetUserId });
            this.emitEvent({ type: 'call_initiated', data: { targetUserId } });

            setTimeout(() => {
                if (this.peer && !this.peer.connected) {
                    this.emitEvent({
                        type: 'call_error',
                        data: { message: 'Call timeout - no answer' }
                    });
                    this.endCall();
                }
            }, this.config.callTimeout);

        } catch (error) {
            this.emitEvent({
                type: 'call_error',
                data: { message: (error as Error).message }
            });
            throw error;
        }
    }

    async acceptCall(callerId: string): Promise<void> {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        try {
            this.currentCallId = callerId;
            this.isInitiator = false;
            this.reconnectCount = 0;

            const stream = await this.getUserMedia();
            this.peer = this.createPeer(false, stream);

            this.socket.emit('accept_call', { targetUserId: callerId });

        } catch (error) {
            this.emitEvent({
                type: 'call_error',
                data: { message: (error as Error).message }
            });
            throw error;
        }
    }

    rejectCall(callerId: string): void {
        if (this.socket) {
            this.socket.emit('reject_call', { targetUserId: callerId });
        }
        this.cleanup();
    }

    endCall(): void {
        if (this.socket && this.currentCallId) {
            this.socket.emit('end_call', { targetUserId: this.currentCallId });
        }
        this.cleanup();
    }

    toggleMute(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }

    isMuted(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            return audioTrack ? !audioTrack.enabled : false;
        }
        return false;
    }

    isCallActive(): boolean {
        return this.peer !== null && this.peer.connected;
    }

    async getCallStats(): Promise<RTCStatsReport | null> {
        if (this.peer && (this.peer as any)._pc) {
            return await (this.peer as any)._pc.getStats();
        }
        return null;
    }

    private cleanup(): void {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        this.currentCallId = null;
        this.isInitiator = false;
        this.reconnectCount = 0;
    }

    reset(): void {
        this.cleanup();
        this.eventListeners = [];
        
        if (this.socket) {
            this.socket.off('incoming_call');
            this.socket.off('call_accepted');
            this.socket.off('call_rejected');
            this.socket.off('call_ended');
            this.socket.off('call_signal');
            this.socket.off('call_error');
            this.socket = null;
        }
    }

    public static reset(): void {
        if (VoiceCallService._instance) {
            VoiceCallService._instance.reset();
        }
    }
}

export default VoiceCallService;

// Force module context
export {};