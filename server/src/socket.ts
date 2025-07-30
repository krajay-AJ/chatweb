import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from './utils/logger';

interface AuthenticatedSocket extends Socket {
    user?: any;
}

// Store available users for matching
const availableUsers = new Map<string, { socketId: string; username: string; searchStartTime?: number }>();
const scanningUsers = new Map<string, { socketId: string; username: string; searchStartTime: number }>();
const connectedPairs = new Map<string, string>(); // userId -> partnerId
const userSockets = new Map<string, string>(); // userId -> socketId

export const setupSocketHandlers = (io: SocketServer) => {
    // Authentication middleware for sockets
    io.use((socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Allow demo token in development
            if (process.env.NODE_ENV === 'development' && token === 'demo-token') {
                // Use the user information passed from the client
                const { username, email, gender } = socket.handshake.auth;
                socket.user = {
                    id: username || `demo-user-${socket.id}`,
                    email: email || `demo-${socket.id}@example.com`,
                    username: username || `DemoUser-${socket.id.substring(0, 8)}`,
                    gender: gender || 'not_specified'
                };
                return next();
            }

            // For real JWT tokens
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            socket.user = decoded;
            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    }); io.on('connection', (socket: AuthenticatedSocket) => {
        logger.info(`User connected: ${socket.user?.id || 'anonymous'}`);

        // Store user socket mapping
        if (socket.user?.id) {
            userSockets.set(socket.user.id, socket.id);
        }

        // Join user to their personal room
        if (socket.user?.id) {
            socket.join(`user:${socket.user.id}`);
        }

        // Handle joining conversation rooms
        socket.on('join_conversation', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            logger.info(`User ${socket.user?.id} joined conversation ${conversationId}`);
        });

        // Handle leaving conversation rooms
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
            logger.info(`User ${socket.user?.id} left conversation ${conversationId}`);
        });

        // Handle user discovery and matching
        socket.on('find_user', (data: { username: string }) => {
            try {
                const userId = socket.user?.id;
                const username = data.username || socket.user?.email || `User${userId}`;

                if (!userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }

                // Check if user is already connected to someone
                if (connectedPairs.has(userId)) {
                    socket.emit('error', { message: 'Already connected to another user' });
                    return;
                }

                // Add user to scanning list
                scanningUsers.set(userId, {
                    socketId: socket.id,
                    username,
                    searchStartTime: Date.now()
                });

                // Try to find another scanning user immediately
                const otherUsers = Array.from(scanningUsers.entries()).filter(
                    ([id, user]) => id !== userId && !connectedPairs.has(id)
                );

                if (otherUsers.length > 0) {
                    // Match with the first available user
                    const [otherUserId, otherUser] = otherUsers[0];

                    // Create connection
                    connectedPairs.set(userId, otherUserId);
                    connectedPairs.set(otherUserId, userId);

                    // Remove both from scanning
                    scanningUsers.delete(userId);
                    scanningUsers.delete(otherUserId);

                    // Notify both users
                    socket.emit('user_found', { username: otherUser.username });
                    io.to(otherUser.socketId).emit('user_found', { username });

                    logger.info(`Users connected: ${username} (${userId}) <-> ${otherUser.username} (${otherUserId})`);
                } else {
                    // Start timeout for this user (30 seconds)
                    setTimeout(() => {
                        if (scanningUsers.has(userId) && !connectedPairs.has(userId)) {
                            scanningUsers.delete(userId);
                            socket.emit('scanning_timeout');
                            logger.info(`Scanning timeout for user ${username} (${userId})`);
                        }
                    }, 30000);

                    logger.info(`User ${username} (${userId}) started scanning for other users`);
                }
            } catch (error) {
                logger.error('Find user error:', error);
                socket.emit('error', { message: 'Failed to find user' });
            }
        });

        socket.on('stop_scanning', () => {
            try {
                const userId = socket.user?.id;
                if (userId && scanningUsers.has(userId)) {
                    scanningUsers.delete(userId);
                    logger.info(`User ${userId} stopped scanning`);
                }
            } catch (error) {
                logger.error('Stop scanning error:', error);
            }
        });

        // Handle sending messages between matched users
        socket.on('send_message', (data: any) => {
            try {
                const userId = socket.user?.id;
                const partnerId = connectedPairs.get(userId);

                if (!partnerId) {
                    socket.emit('error', { message: 'Not connected to any user' });
                    return;
                }

                // Get partner's socket ID from the userSockets map
                const partnerSocketId = userSockets.get(partnerId);

                if (!partnerSocketId) {
                    socket.emit('error', { message: 'Partner is not connected' });
                    return;
                }

                const message = {
                    id: Date.now().toString(),
                    content: data.content,
                    senderId: userId,
                    timestamp: new Date().toISOString(),
                    type: data.type || 'text'
                };

                // Send to partner
                io.to(partnerSocketId).emit('new_message', message);

                // Acknowledge sender
                socket.emit('message_sent', { success: true, messageId: message.id });

                logger.info(`Message sent from ${userId} to ${partnerId}: "${data.content}"`);
            } catch (error) {
                logger.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId: socket.user?.id,
                conversationId,
            });
        });

        socket.on('typing_stop', (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                userId: socket.user?.id,
                conversationId,
            });
        });

        // Handle message reactions
        socket.on('add_reaction', (data: any) => {
            try {
                const { messageId, reaction } = data;

                // Placeholder implementation
                // In a real implementation, you would save the reaction to the database

                io.emit('reaction_added', {
                    messageId,
                    userId: socket.user?.id,
                    reaction,
                });

                logger.info(`Reaction added to message ${messageId} by user ${socket.user?.id}`);
            } catch (error) {
                logger.error('Add reaction error:', error);
                socket.emit('error', { message: 'Failed to add reaction' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            try {
                const userId = socket.user?.id;
                if (userId) {
                    // Remove from scanning users
                    scanningUsers.delete(userId);

                    // Handle partner disconnection
                    const partnerId = connectedPairs.get(userId);
                    if (partnerId) {
                        // Notify partner about disconnection using userSockets map
                        const partnerSocketId = userSockets.get(partnerId);

                        if (partnerSocketId) {
                            io.to(partnerSocketId).emit('user_disconnected');
                        }

                        // Remove both from connected pairs
                        connectedPairs.delete(userId);
                        connectedPairs.delete(partnerId);

                        logger.info(`User ${userId} disconnected, partner ${partnerId} notified`);
                    }

                    // Remove from available users and socket mapping
                    availableUsers.delete(userId);
                    userSockets.delete(userId);
                }

                logger.info(`User disconnected: ${socket.user?.id || 'anonymous'}`);
            } catch (error) {
                logger.error('Disconnect handling error:', error);
            }
        });

        // Handle errors
        socket.on('error', (error: any) => {
            logger.error('Socket error:', error);
        });
    });

    logger.info('Socket handlers initialized');
};
