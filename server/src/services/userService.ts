import bcrypt from 'bcryptjs';
import { pgPool, getMongoDB, redisClient } from '../config/database';
import { logger } from '../utils/logger';

export interface User {
    id: number;
    email: string;
    username: string;
    gender: string;
    created_at: Date;
    updated_at: Date;
    is_verified: boolean;
    last_login?: Date;
}

export interface CreateUserData {
    email: string;
    username: string;
    password: string;
    gender: string;
}

export class UserService {
    // Create user in PostgreSQL
    static async createUser(userData: CreateUserData): Promise<User> {
        const { email, username, password, gender } = userData;

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
            INSERT INTO users (email, username, password, gender)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, username, gender, created_at, updated_at
        `;

        try {
            const result = await pgPool.query(query, [email, username, passwordHash, gender]);
            const user = result.rows[0];

            user.is_verified = true;

            // Cache user in Redis for 1 hour
            await redisClient.setEx(`user:${user.id}`, 3600, JSON.stringify(user));

            logger.info(`User created successfully: ${username}`);
            return user;
        } catch (error: any) {
            if (error.code === '23505') { // Unique constraint violation
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                } else if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }

    // Find user by email or username
    static async findUserByIdentifier(identifier: string): Promise<User | null> {
        const query = `
            SELECT id, email, username, password, gender, created_at, updated_at, last_login
            FROM users 
            WHERE email = $1 OR username = $1
        `;

        try {
            const result = await pgPool.query(query, [identifier]);
            const user = result.rows[0];
            if (user) {
                user.is_verified = true; // Set default for now
            }
            return user || null;
        } catch (error) {
            logger.error('Error finding user:', error);
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    // Update last login
    static async updateLastLogin(userId: number): Promise<void> {
        const query = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`;

        try {
            await pgPool.query(query, [userId]);

            // Update cache
            const cachedUser = await redisClient.get(`user:${userId}`);
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                user.last_login = new Date();
                await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));
            }
        } catch (error) {
            logger.error('Error updating last login:', error);
        }
    }

    // Get user by ID (with cache)
    static async getUserById(userId: number): Promise<User | null> {
        try {
            // Try cache first
            const cachedUser = await redisClient.get(`user:${userId}`);
            if (cachedUser) {
                return JSON.parse(cachedUser);
            }

            // If not in cache, query database
            const query = `
                SELECT id, email, username, gender, created_at, updated_at, is_verified, last_login
                FROM users WHERE id = $1
            `;
            const result = await pgPool.query(query, [userId]);
            const user = result.rows[0];

            if (user) {
                // Cache for 1 hour
                await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));
            }

            return user || null;
        } catch (error) {
            logger.error('Error getting user by ID:', error);
            throw error;
        }
    }
}
