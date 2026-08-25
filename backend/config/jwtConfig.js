/**
 * CryptoScope AI — Centralized JWT Secret & Security Configuration
 *
 * Enforces mandatory secret configuration and eliminates hardcoded fallbacks.
 */

const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Retrieve and strictly validate the application JWT Secret.
 * Fails fast if the secret is missing or insecure.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
        throw new Error(
            "FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET environment variable is missing or empty. " +
            "A cryptographically secure secret (at least 32 characters) must be configured in backend/.env."
        );
    }

    if (process.env.NODE_ENV === "production" && secret.trim().length < 32) {
        throw new Error(
            "FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET is too short for production use. " +
            "Production requires a secret with at least 32 characters."
        );
    }

    return secret.trim();
}

/**
 * Startup validation helper called during server boot
 */
function validateJwtConfigOnStartup() {
    return getJwtSecret();
}

module.exports = {
    getJwtSecret,
    validateJwtConfigOnStartup,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
};
