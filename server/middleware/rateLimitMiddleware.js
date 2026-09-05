const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    skipFailedRequests: false, // Count failed requests
});

/**
 * Rate limiter for general API endpoints
 * Prevents API abuse
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for file upload endpoints
 * Prevents storage abuse
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 uploads per hour
    message: {
        message: 'Too many file uploads from this IP, please try again after 1 hour',
        code: 'UPLOAD_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for payment endpoints
 * Extra strict to prevent payment abuse
 */
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 payment requests per hour
    message: {
        message: 'Too many payment requests from this IP, please try again after 1 hour',
        code: 'PAYMENT_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for password reset endpoints
 * Prevents email flooding
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        message: 'Too many password reset attempts, please try again after 1 hour',
        code: 'PASSWORD_RESET_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    apiLimiter,
    uploadLimiter,
    paymentLimiter,
    passwordResetLimiter
};
