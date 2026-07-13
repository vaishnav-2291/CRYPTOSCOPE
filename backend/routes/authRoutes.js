const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getCurrentUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Logged-in User Details
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;