const rateLimit = require("express-rate-limit");

/**
 * General API Rate Limiter
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again in 15 minutes.",
        code: "RATE_LIMIT_EXCEEDED",
    },
});

/**
 * Wallet Scan Rate Limiter
 */
const scanLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: "Wallet scan rate limit reached. Please wait a moment before scanning again.",
        code: "SCAN_RATE_LIMIT_EXCEEDED",
    },
});

/**
 * Auth Rate Limiter
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        success: false,
        message: "Too many login/registration attempts. Please try again in 15 minutes.",
        code: "AUTH_RATE_LIMIT_EXCEEDED",
    },
});

module.exports = {
    apiLimiter,
    scanLimiter,
    authLimiter,
};
