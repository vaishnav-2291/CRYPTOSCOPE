const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { logActivity } = require("../services/activityService");

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
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userCount = await User.countDocuments();
        const assignedRole = userCount === 0 || role === "admin" ? "admin" : "user";

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: assignedRole,
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

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
// FORGOT & RESET PASSWORD (Persisted in MongoDB)
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

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        const resetToken = crypto.randomBytes(32).toString("hex");

        if (user) {
            user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
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
        }

        res.json({
            success: true,
            message: "If that email exists in our registry, a password reset token has been generated.",
            resetToken,
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
        const { resetToken, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }

        if (!resetToken) {
            return res.status(400).json({ success: false, message: "Reset token is required." });
        }

        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired password reset token." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "PASSWORD_RESET_COMPLETED",
            resourceType: "USER",
            resourceId: user._id.toString(),
            status: "SUCCESS",
            req,
        });

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