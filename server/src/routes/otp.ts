import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { OTPService } from '../services/otpService';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const sendOTPSchema = Joi.object({
    email: Joi.string().email().required()
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
});

// Rate limiting for OTP endpoints
const otpSendLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 OTP requests per 5 minutes per IP
    message: {
        success: false,
        error: 'Too many OTP requests. Please wait before requesting another OTP.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const otpVerifyLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 verification attempts per 15 minutes
    message: {
        success: false,
        error: 'Too many OTP verification attempts. Please try again later.'
    }
});

// Send OTP endpoint
router.post('/send-otp', otpSendLimit, async (req, res) => {
    try {
        const { error, value } = sendOTPSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { email } = value;

        // Check if OTP already exists and is still valid
        const otpStatus = await OTPService.getOTPStatus(email);
        if (otpStatus.exists && otpStatus.ttl > 240) { // Don't allow new OTP if current one has >4 minutes left
            return res.status(429).json({
                success: false,
                message: `OTP already sent. Please wait ${Math.ceil(otpStatus.ttl / 60)} minutes before requesting a new one.`,
                retryAfter: otpStatus.ttl
            });
        }

        // Generate and store OTP
        const otp = OTPService.generateOTP();
        await OTPService.storeOTP(email, otp);

        // Send OTP (mock implementation)
        const emailSent = await OTPService.sendOTP(email, otp);

        if (emailSent) {
            logger.info(`OTP sent successfully to ${email}`);
            res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                email: email,
                expiresIn: 300 // 5 minutes
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again.'
            });
        }

    } catch (error) {
        logger.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Verify OTP endpoint
router.post('/verify-otp', otpVerifyLimit, async (req, res) => {
    try {
        const { error, value } = verifyOTPSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { email, otp } = value;

        // Verify OTP
        const isValid = await OTPService.verifyOTP(email, otp);

        if (isValid) {
            logger.info(`OTP verified successfully for ${email}`);
            res.status(200).json({
                success: true,
                message: 'OTP verified successfully',
                email: email
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

    } catch (error) {
        logger.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get OTP status endpoint (for debugging in development)
router.get('/otp-status/:email', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ message: 'Not found' });
    }

    try {
        const email = req.params.email;
        const status = await OTPService.getOTPStatus(email);

        res.status(200).json({
            success: true,
            email: email,
            otpExists: status.exists,
            timeRemaining: status.ttl
        });
    } catch (error) {
        logger.error('OTP status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
