import { redisClient } from '../config/database';
import { logger } from '../utils/logger';

export class OTPService {
    // Generate a 6-digit OTP
    static generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store OTP in Redis with expiration (5 minutes)
    static async storeOTP(email: string, otp: string): Promise<void> {
        const key = `otp:${email.toLowerCase()}`;
        const expiry = 5 * 60; // 5 minutes in seconds

        await redisClient.setEx(key, expiry, otp);
        logger.info(`OTP stored for ${email} (expires in ${expiry}s)`);
    }

    // Verify OTP
    static async verifyOTP(email: string, providedOTP: string): Promise<boolean> {
        const key = `otp:${email.toLowerCase()}`;

        try {
            const storedOTP = await redisClient.get(key);

            if (!storedOTP) {
                logger.warn(`OTP verification failed: No OTP found for ${email}`);
                return false;
            }

            const isValid = storedOTP === providedOTP;

            if (isValid) {
                // Delete OTP after successful verification
                await redisClient.del(key);
                logger.info(`OTP verified successfully for ${email}`);
            } else {
                logger.warn(`OTP verification failed: Invalid OTP for ${email}`);
            }

            return isValid;
        } catch (error) {
            logger.error('Error verifying OTP:', error);
            return false;
        }
    }

    // Send OTP via email (mock implementation for development)
    static async sendOTP(email: string, otp: string): Promise<boolean> {
        try {
            // In development, just log the OTP
            if (process.env.NODE_ENV === 'development') {
                logger.info(`📧 MOCK EMAIL - OTP for ${email}: ${otp}`);
                console.log(`\n🔐 OTP for ${email}: ${otp}\n`);
                return true;
            }

            // In production, you would integrate with actual email service
            // Examples: SendGrid, AWS SES, Nodemailer, etc.
            logger.info(`Email service not configured. OTP for ${email}: ${otp}`);
            return true;
        } catch (error) {
            logger.error('Error sending OTP:', error);
            return false;
        }
    }

    // Delete OTP (cleanup)
    static async deleteOTP(email: string): Promise<void> {
        const key = `otp:${email.toLowerCase()}`;
        await redisClient.del(key);
        logger.info(`OTP deleted for ${email}`);
    }

    // Check if OTP exists and get remaining TTL
    static async getOTPStatus(email: string): Promise<{ exists: boolean; ttl: number }> {
        const key = `otp:${email.toLowerCase()}`;

        try {
            const exists = await redisClient.exists(key);
            const ttl = exists ? await redisClient.ttl(key) : 0;

            return { exists: !!exists, ttl };
        } catch (error) {
            logger.error('Error checking OTP status:', error);
            return { exists: false, ttl: 0 };
        }
    }
}
