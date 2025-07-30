import { getMongoDB, redisClient } from '../config/database';
import { logger } from '../utils/logger';

export interface Message {
    _id?: string;
    conversationId: string;
    senderId: number;
    senderUsername: string;
    content: string;
    type: 'text' | 'system';
    timestamp: Date;
    gender?: string;
}

export interface Conversation {
    _id?: string;
    participants: number[];
    isAnonymous: boolean;
    createdAt: Date;
    lastActivity: Date;
}

export class MessageService {
    // Create a new conversation in MongoDB
    static async createConversation(participants: number[]): Promise<string> {
        try {
            const db = getMongoDB();

            // Omit _id so MongoDB generates it
            const conversation = {
                participants,
                isAnonymous: true,
                createdAt: new Date(),
                lastActivity: new Date()
            };
            const result = await db.collection('conversations').insertOne(conversation);

            // Cache conversation participants in Redis
            await redisClient.setEx(
                `conversation:${result.insertedId}:participants`,
                3600,
                JSON.stringify(participants)
            );

            logger.info(`Conversation created: ${result.insertedId}`);
            return result.insertedId.toString();
        } catch (error) {
            logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    // Save message to MongoDB
    static async saveMessage(messageData: Omit<Message, '_id' | 'timestamp'>): Promise<Message> {
        try {
            const db = getMongoDB();

            // Omit _id so MongoDB generates it
            const message = {
                ...messageData,
                timestamp: new Date()
            };
            const result = await db.collection('messages').insertOne(message);
            (message as any)._id = result.insertedId.toString();

            // Update conversation last activity
            // Convert conversationId to ObjectId for MongoDB update
            const { ObjectId } = require('mongodb');
            await db.collection('conversations').updateOne(
                { _id: new ObjectId(messageData.conversationId) },
                { $set: { lastActivity: new Date() } }
            );

            // Cache recent message in Redis for real-time features
            await redisClient.lPush(
                `conversation:${messageData.conversationId}:recent`,
                JSON.stringify(message)
            );
            await redisClient.lTrim(`conversation:${messageData.conversationId}:recent`, 0, 99); // Keep last 100 messages

            logger.info(`Message saved: ${result.insertedId}`);
            return message;
        } catch (error) {
            logger.error('Error saving message:', error);
            throw error;
        }
    }

    // Get conversation messages from MongoDB
    static async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
        try {
            const db = getMongoDB();
            const skip = (page - 1) * limit;

            const messages = await db.collection('messages')
                .find({ conversationId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            // Map to Message type (if needed)
            return messages.map((msg: any) => ({
                _id: msg._id?.toString(),
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                senderUsername: msg.senderUsername,
                content: msg.content,
                type: msg.type,
                timestamp: msg.timestamp,
                gender: msg.gender
            })).reverse(); // Return in chronological order
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    // Get recent messages from Redis cache
    static async getRecentMessages(conversationId: string): Promise<Message[]> {
        try {
            const cachedMessages = await redisClient.lRange(`conversation:${conversationId}:recent`, 0, 49);
            return cachedMessages.map(msg => JSON.parse(msg)).reverse();
        } catch (error) {
            logger.error('Error getting recent messages from cache:', error);
            return [];
        }
    }

    // Find or create anonymous conversation
    static async findOrCreateAnonymousConversation(userId: number): Promise<string> {
        try {
            const db = getMongoDB();

            // Try to find an available conversation (with only one participant)
            const availableConversation = await db.collection('conversations').findOne({
                participants: { $size: 1 },
                isAnonymous: true
            });

            if (availableConversation) {
                // Join existing conversation
                const { ObjectId } = require('mongodb');
                await db.collection('conversations').updateOne(
                    { _id: new ObjectId(availableConversation._id) },
                    {
                        $addToSet: { participants: userId },
                        $set: { lastActivity: new Date() }
                    }
                );

                logger.info(`User ${userId} joined conversation ${availableConversation._id}`);
                return availableConversation._id.toString();
            } else {
                // Create new conversation and wait for someone to join
                return await this.createConversation([userId]);
            }
        } catch (error) {
            logger.error('Error finding/creating anonymous conversation:', error);
            throw error;
        }
    }
}
