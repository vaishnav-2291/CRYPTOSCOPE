const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwtConfig");

/**
 * Extract raw JWT token from header (handles 'Bearer <token>' or raw token)
 */
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7).trim();
    }
    return authHeader.trim();
};

/**
 * Strict authentication middleware
 */
const authMiddleware = (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. No token provided.",
            });
        }

        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
            error: error.message,
        });
    }
};

/**
 * Optional authentication middleware for public/shared views
 */
const optionalAuth = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const secret = getJwtSecret();
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
        } else {
            req.user = null;
        }
    } catch (error) {
        // Continue even if token is invalid
        req.user = null;
    }
    next();
};

/**
 * Admin role authorization middleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Administrator privileges required.",
        });
    }
    next();
};

module.exports = {
    authMiddleware,
    optionalAuth,
    requireAdmin,
};