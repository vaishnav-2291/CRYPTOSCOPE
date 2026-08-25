const express = require("express");
const router = express.Router();

const {
    register,
    login,
    refreshToken,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    updateProfile,
    googleAuthRedirect,
    googleAuthCallback,
} = require("../controllers/authController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { validateRegister } = require("../middleware/validators");
const { authLimiter } = require("../middleware/rateLimiter");

// Authentication Endpoints
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refreshToken);

// Google OAuth 2.0 Endpoints
router.get("/google", authLimiter, googleAuthRedirect);
router.get("/google/callback", googleAuthCallback);

// Profile & Account Management
router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateProfile);

// Password Recovery
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

module.exports = router;