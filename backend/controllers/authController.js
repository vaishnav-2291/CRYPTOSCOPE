const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { logActivity } = require("../services/activityService");
const realtimeService = require("../services/realtimeService");

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "7d";

function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            role: user.role || "user",
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        {
            id: user._id.toString(),
        },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

// =============================================================================
// =============================================================================
// REGISTER (Persistent in MongoDB)
// =============================================================================
exports.register = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            success: false,
            message: "Database service is currently unavailable. Registration cannot be persisted.",
        });
    }

    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Security rule: Public registration ALWAYS creates standard 'user' role
        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "user",
            status: "active",
        });

        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        // Persistent Audit Activity
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "USER_REGISTERED",
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: { name: user.name, role: user.role },
            status: "SUCCESS",
            req,
        });

        return res.status(201).json({
            success: true,
            message: "Account registered successfully and stored in MongoDB.",
            token: accessToken,
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Registration failed." });
    }
};

// =============================================================================
// LOGIN (Persistent Verification in MongoDB)
// =============================================================================
exports.login = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            success: false,
            message: "Database service is currently unavailable. Login cannot be verified.",
        });
    }

    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // Account status check
        if (user.status === "suspended") {
            return res.status(403).json({
                success: false,
                message: "Account is suspended. Please contact an administrator.",
            });
        }

        // Check if user has a password set (local auth)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "This account was created with Google Sign-In. Please use Continue with Google.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Log failed attempt
            await logActivity({
                userId: user._id,
                userEmail: user.email,
                action: "USER_LOGIN",
                resourceType: "USER",
                resourceId: user._id.toString(),
                details: { reason: "Incorrect password" },
                status: "FAILED",
                req,
            });
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // Generate tokens with trusted role directly from MongoDB document
        const { accessToken, refreshToken } = generateTokens(user);

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        user.lastLoginIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
        await user.save();

        // Persistent Audit Activity
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "USER_LOGIN",
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: { role: user.role },
            status: "SUCCESS",
            req,
        });

        res.json({
            success: true,
            message: "Login successful.",
            token: accessToken,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                watchlistCount: user.watchlist?.length || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Login failed." });
    }
};

// =============================================================================
// REFRESH TOKEN
// =============================================================================
exports.refreshToken = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: "Refresh token is required." });
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: "Invalid session or expired refresh token." });
        }

        if (user.status === "suspended") {
            return res.status(403).json({ success: false, message: "Account is suspended. Please contact an administrator." });
        }

        const tokens = generateTokens(user);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            success: true,
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

// =============================================================================
// CURRENT USER
// =============================================================================
exports.getCurrentUser = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const user = await User.findById(req.user.id).select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found in database." });
        }

        if (user.status === "suspended") {
            return res.status(403).json({ success: false, message: "Account is suspended. Please contact an administrator." });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar || null,
                authProvider: user.authProvider || "local",
                watchlist: user.watchlist || [],
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================================================
// GOOGLE OAUTH 2.0 HANDLERS
// =============================================================================
const { OAuth2Client } = require("google-auth-library");

const getGoogleOAuthClient = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

    if (!clientId || !clientSecret) {
        return null;
    }

    return new OAuth2Client(clientId, clientSecret, callbackUrl);
};

/**
 * Initiate Google OAuth 2.0 Authorization Flow
 */
exports.googleAuthRedirect = async (req, res) => {
    try {
        const clientOrigin = req.query.origin || (req.headers.referer ? new URL(req.headers.referer).origin : "http://localhost:3000");
        const oauth2Client = getGoogleOAuthClient();

        if (!oauth2Client) {
            return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.")}`);
        }

        // Cryptographically signed state token for CSRF protection and origin preservation
        const statePayload = {
            nonce: crypto.randomBytes(16).toString("hex"),
            origin: clientOrigin,
            createdAt: Date.now(),
        };

        const state = jwt.sign(statePayload, JWT_SECRET, { expiresIn: "10m" });

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "openid",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            state,
            prompt: "select_account",
        });

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Google OAuth Redirect Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to initiate Google authentication." });
    }
};

/**
 * Handle Google OAuth 2.0 Callback
 */
exports.googleAuthCallback = async (req, res) => {
    let clientOrigin = "http://localhost:3000";
    const { code, state, error, error_description } = req.query;

    // Decode state to retrieve original frontend client origin
    if (state) {
        try {
            const decoded = jwt.verify(state, JWT_SECRET);
            if (decoded.origin) {
                clientOrigin = decoded.origin;
            }
        } catch {
            // State expired or invalid
        }
    }

    // 1. Handle user cancellation or OAuth error from Google
    if (error) {
        const message = error === "access_denied"
            ? "Google sign-in was cancelled or access was denied."
            : (error_description || error || "Google authentication failed.");
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent(message)}`);
    }

    // 2. Validate code and state presence
    if (!code || !state) {
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Missing authorization code or state token from Google.")}`);
    }

    // 3. Verify state token (CSRF and tamper protection)
    try {
        jwt.verify(state, JWT_SECRET);
    } catch (err) {
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("OAuth session expired or security verification failed. Please try again.")}`);
    }

    // 4. Check DB connection
    if (!isDbConnected()) {
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Database service is currently unavailable. Please try again.")}`);
    }

    const oauth2Client = getGoogleOAuthClient();
    if (!oauth2Client) {
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Google OAuth is not configured on the server.")}`);
    }

    try {
        // 5. Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.id_token) {
            return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("No Google ID token was returned by Google.")}`);
        }

        // 6. Cryptographically verify Google ID token (issuer, audience, expiry)
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Unable to retrieve verified profile or email from Google.")}`);
        }

        const googleId = payload.sub;
        const normalizedEmail = payload.email.toLowerCase().trim();
        const name = payload.name || payload.given_name || normalizedEmail.split("@")[0];
        const avatar = payload.picture || null;

        // 7. Find or create user in MongoDB
        let user = await User.findOne({ googleId });
        let activityAction = "GOOGLE_LOGIN";

        if (!user) {
            // Check if user already exists by email (link Google identity)
            user = await User.findOne({ email: normalizedEmail });
            if (user) {
                user.googleId = googleId;
                if (user.authProvider === "local") {
                    user.authProvider = "local+google";
                }
                if (!user.avatar && avatar) {
                    user.avatar = avatar;
                }
                activityAction = "GOOGLE_ACCOUNT_LINKED";
            } else {
                // Register new user via Google - strictly standard 'user' role
                user = new User({
                    name: name.trim(),
                    email: normalizedEmail,
                    googleId,
                    avatar,
                    authProvider: "google",
                    role: "user",
                    status: "active",
                });
                activityAction = "USER_REGISTERED_VIA_GOOGLE";
            }
        } else {
            // Update avatar if not set
            if (!user.avatar && avatar) {
                user.avatar = avatar;
            }
        }

        // Account status check
        if (user.status === "suspended") {
            return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Account is suspended. Please contact an administrator.")}`);
        }

        // 8. Generate standard CRYPTOSCOPE JWT access and refresh tokens
        const { accessToken, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        user.lastLoginIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
        await user.save();

        // 9. Persist audit activity to MongoDB and emit realtime telemetry
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: activityAction,
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: {
                authProvider: user.authProvider,
                role: user.role,
                email: user.email,
            },
            status: "SUCCESS",
            req,
        });

        // 10. Redirect to frontend with tokens
        return res.redirect(
            `${clientOrigin}/login?oauth_success=true&token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`
        );
    } catch (oauthErr) {
        console.error("Google OAuth Exchange Error:", oauthErr.message);
        return res.redirect(`${clientOrigin}/login?error=${encodeURIComponent(oauthErr.message || "Failed to authenticate with Google.")}`);
    }
};

// =============================================================================
// FORGOT & RESET PASSWORD (Persisted in MongoDB & Single-Use Hashed Tokens)
// =============================================================================
exports.forgotPassword = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            const rawToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
            await user.save();

            await logActivity({
                userId: user._id,
                userEmail: user.email,
                action: "PASSWORD_RESET_REQUESTED",
                resourceType: "USER",
                resourceId: user._id.toString(),
                status: "SUCCESS",
                req,
            });

            // Development / Local environment simulated email output (never exposed via API JSON)
            const clientOrigin = req.headers.referer
                ? new URL(req.headers.referer).origin
                : (process.env.FRONTEND_URL || "http://localhost:3000");
            const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;
            console.log(`\n================== [SECURE EMAIL SIMULATOR] ==================`);
            console.log(`To: ${user.email}`);
            console.log(`Subject: Password Reset Request for CryptoScope AI`);
            console.log(`Reset Link: ${resetUrl}`);
            console.log(`Expires in: 15 minutes (Single-Use Only)`);
            console.log(`===============================================================\n`);
        }

        // Generic response prevents account enumeration attack and never exposes raw token
        res.json({
            success: true,
            message: "If that email address is registered, password reset instructions have been generated.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const { token, resetToken, newPassword } = req.body;
        const rawToken = token || resetToken;

        if (!rawToken || typeof rawToken !== "string" || !rawToken.trim()) {
            return res.status(400).json({ success: false, message: "Password reset token is required." });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        }

        const hashedToken = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid, expired, or already used password reset link. Please request a new one.",
            });
        }

        // Immediately update password and invalidate reset token + refresh tokens
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.refreshToken = null; // Invalidate existing session refresh tokens
        user.passwordChangedAt = new Date();
        await user.save();

        // Persistent audit log
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "PASSWORD_RESET_COMPLETED",
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: { method: "SECURE_TOKEN_RESET" },
            status: "SUCCESS",
            req,
        });

        // Broadcast realtime session invalidation event to other connected clients
        realtimeService.emitPasswordChanged(user._id);

        res.json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================================================
// UPDATE PROFILE (Persisted in MongoDB)
// =============================================================================
exports.updateProfile = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Name cannot be empty." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.name = name.trim();
        await user.save();

        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "PROFILE_UPDATED",
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: { newName: user.name },
            status: "SUCCESS",
            req,
        });

        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};