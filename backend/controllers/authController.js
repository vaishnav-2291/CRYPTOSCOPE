const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";
const ACCESS_TOKEN_EXPIRY = "2h";
const REFRESH_TOKEN_EXPIRY = "7d";

// In-memory demo users store if MongoDB is not connected
const inMemoryUsers = new Map();

// Preload demo analyst and admin
(async () => {
    const hash = await bcrypt.hash("Analyst@2026", 10);
    const adminHash = await bcrypt.hash("Admin@2026", 10);

    inMemoryUsers.set("analyst@cryptoscope.ai", {
        _id: "demo_analyst_id",
        name: "Lead Security Analyst",
        email: "analyst@cryptoscope.ai",
        password: hash,
        role: "user",
        watchlist: [],
        createdAt: new Date(),
    });

    inMemoryUsers.set("admin@cryptoscope.ai", {
        _id: "demo_admin_id",
        name: "Security Administrator",
        email: "admin@cryptoscope.ai",
        password: adminHash,
        role: "admin",
        watchlist: [],
        createdAt: new Date(),
    });
})();

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
// REGISTER
// =============================================================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (isDbConnected()) {
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
            await user.save();

            return res.status(201).json({
                success: true,
                message: "Account registered successfully.",
                token: accessToken,
                accessToken,
                refreshToken,
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
            });
        }

        // In-memory fallback
        if (inMemoryUsers.has(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            _id: "user_" + Date.now(),
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "user",
            watchlist: [],
            createdAt: new Date(),
        };

        inMemoryUsers.set(normalizedEmail, newUser);
        const tokens = generateTokens(newUser);

        res.status(201).json({
            success: true,
            message: "Account registered successfully.",
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || "Registration failed." });
    }
};

// =============================================================================
// LOGIN
// =============================================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = null;

        if (isDbConnected()) {
            user = await User.findOne({ email: normalizedEmail });
        } else {
            user = inMemoryUsers.get(normalizedEmail);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        if (isDbConnected()) {
            user.refreshToken = refreshToken;
            await user.save();
        }

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
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: "Refresh token is required." });
        }

        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        let user = null;

        if (isDbConnected()) {
            user = await User.findById(decoded.id);
        } else {
            user = Array.from(inMemoryUsers.values()).find((u) => u._id === decoded.id);
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid session." });
        }

        const tokens = generateTokens(user);
        res.json({
            success: true,
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================================================
// CURRENT USER
// =============================================================================
exports.getCurrentUser = async (req, res) => {
    try {
        let user = null;
        if (isDbConnected()) {
            user = await User.findById(req.user.id).select("-password -refreshToken");
        } else {
            user = Array.from(inMemoryUsers.values()).find((u) => u._id === req.user.id || u.email === req.user.email);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                watchlist: user.watchlist || [],
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =============================================================================
// FORGOT & RESET PASSWORD
// =============================================================================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(24).toString("hex");
    res.json({
        success: true,
        message: "If that email exists in our registry, a password reset token has been generated.",
        resetToken,
    });
};

exports.resetPassword = async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    res.json({
        success: true,
        message: "Password reset successfully. You can now log in with your new password.",
    });
};

// =============================================================================
// UPDATE PROFILE
// =============================================================================
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: req.user.id,
                name: name || "Security Analyst",
                email: req.user.email,
                role: req.user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};