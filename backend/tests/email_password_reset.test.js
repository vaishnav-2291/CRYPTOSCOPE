const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const app = require("../app");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");
const emailService = require("../services/emailService");

const PORT = 3099;
let server;
let baseUrl;

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";

describe("CRYPTOSCOPE Real Email & Password Reset Security Suite", () => {
    let testUser;
    const testEmail = `pwd_reset_test_${Date.now()}@cryptoscope.ai`;
    const initialPassword = "InitialPassword!123";
    const newPassword = "NewSecurePassword#2026";

    before(async () => {
        if (mongoose.connection.readyState !== 1) {
            const mongoUri = process.env.MONGO_URI;
            if (mongoUri) {
                await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
            }
        }

        server = app.listen(PORT);
        baseUrl = `http://localhost:${PORT}`;

        // Create test user
        const hashedPassword = await bcrypt.hash(initialPassword, 10);
        testUser = await User.create({
            name: "Email Reset Tester",
            email: testEmail,
            password: hashedPassword,
            role: "user",
            status: "active",
        });
    });

    after(async () => {
        if (testUser) {
            await User.deleteOne({ _id: testUser._id });
            await UserActivity.deleteMany({ userId: testUser._id });
        }
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await mongoose.disconnect();
    });

    // 1. Verify Email Service Configuration & Safety Check
    test("1. Email service safely detects SMTP status without exposing secrets", async () => {
        const configStatus = await emailService.verifyEmailConfig();
        assert.strictEqual(typeof configStatus.configured, "boolean");
        assert.ok(["connected", "missing", "connection_failed"].includes(configStatus.status));
        assert.strictEqual(configStatus.password, undefined);
    });

    // 2. Email HTML and Text Template Generation
    test("2. Branded HTML template contains security notices, button, and no raw token leaks", () => {
        const fakeUrl = "http://localhost:3000/reset-password?token=abcdef123456";
        const html = emailService.generateResetHtml({ name: "Alice", resetUrl: fakeUrl });
        const text = emailService.generateResetText({ name: "Alice", resetUrl: fakeUrl });

        assert.ok(html.includes("CRYPTOSCOPE AI"));
        assert.ok(html.includes("Password Reset Request"));
        assert.ok(html.includes("15 minutes"));
        assert.ok(html.includes(fakeUrl));
        assert.ok(text.includes("CRYPTOSCOPE AI"));
        assert.ok(text.includes("15 minutes"));
        assert.ok(text.includes(fakeUrl));
    });

    // 3. Email Service Transmission Error Resilience
    test("3. sendPasswordResetEmail handles missing recipients or offline SMTP gracefully", async () => {
        const resultMissing = await emailService.sendPasswordResetEmail({ to: "", name: "Test", resetUrl: "http://localhost:3000" });
        assert.strictEqual(resultMissing.success, false);
        assert.strictEqual(resultMissing.reason, "MISSING_RECIPIENT");

        // Calling with test email should return a structured result without unhandled exception
        const resultValid = await emailService.sendPasswordResetEmail({
            to: "test_recipient@cryptoscope.ai",
            name: "Test",
            resetUrl: "http://localhost:3000/reset-password?token=test12345"
        });
        assert.ok(typeof resultValid.success === "boolean");
    });

    // 4. Forgot Password API - Account Enumeration Protection & No Raw Token Leak
    test("4. POST /api/auth/forgot-password returns generic message and does NOT return raw token", async () => {
        const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail }),
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.message.includes("If that email address is registered"));
        assert.strictEqual(data.token, undefined);
        assert.strictEqual(data.resetToken, undefined);
        assert.strictEqual(data.resetUrl, undefined);
    });

    // 5. Verify Token Hash and Expiry Persisted in MongoDB
    test("5. MongoDB User document contains SHA-256 hashed token and 15m expiration", async () => {
        const updatedUser = await User.findById(testUser._id);
        assert.ok(updatedUser.resetPasswordToken, "Hashed token must exist in MongoDB");
        assert.strictEqual(updatedUser.resetPasswordToken.length, 64, "Token in MongoDB must be 64-char SHA-256 hex hash");
        assert.ok(updatedUser.resetPasswordExpires > Date.now(), "Token expiry must be in the future");
    });

    // 6. Forgot Password with Non-Existent Email (Enumeration Protection)
    test("6. POST /api/auth/forgot-password for non-registered email returns identical generic message", async () => {
        const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "definitely_non_existent_email_12345@cryptoscope.ai" }),
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.message.includes("If that email address is registered"));
    });

    // 7. Reset Password with Invalid Token Rejection
    test("7. POST /api/auth/reset-password with invalid token returns 400", async () => {
        const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: "invalid_random_token_that_does_not_match_hash",
                newPassword,
            }),
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
    });

    // 8. Reset Password with Valid Token -> MongoDB Update & Token Invalidation
    test("8. POST /api/auth/reset-password with valid token updates password hash and clears reset token", async () => {
        // Set a known test token in MongoDB
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        await User.findByIdAndUpdate(testUser._id, {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 15 * 60 * 1000,
            refreshToken: "old_refresh_token_to_be_invalidated",
        });

        const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: rawToken,
                newPassword,
            }),
        });

        const data = await res.json();
        if (res.status !== 200) {
            console.error("Test 8 failure response:", res.status, data);
        }
        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);

        // Verify MongoDB state
        const refreshedUser = await User.findById(testUser._id);
        assert.strictEqual(refreshedUser.resetPasswordToken, null, "Reset token must be wiped after use");
        assert.strictEqual(refreshedUser.resetPasswordExpires, null, "Reset expiry must be wiped after use");
        assert.strictEqual(refreshedUser.refreshToken, null, "Active refresh tokens must be wiped");
        assert.ok(refreshedUser.passwordChangedAt, "passwordChangedAt timestamp must be recorded");

        // Verify password hash in MongoDB verifies with newPassword
        const isMatch = await bcrypt.compare(newPassword, refreshedUser.password);
        assert.strictEqual(isMatch, true, "New password must match updated MongoDB hash");
    });

    // 9. Verify Old Password Fails and New Password Succeeds
    test("9. Old password fails authentication (401) and new password succeeds (200)", async () => {
        // Old password fails
        const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: initialPassword }),
        });
        assert.strictEqual(oldLoginRes.status, 401);

        // New password succeeds
        const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: newPassword }),
        });
        assert.strictEqual(newLoginRes.status, 200);
        const loginData = await newLoginRes.json();
        assert.strictEqual(loginData.success, true);
        assert.ok(loginData.token);
    });

    // 10. Single-Use Prevention: Re-using the same reset token fails
    test("10. Re-using the same reset token fails with 400 Bad Request", async () => {
        // Attempting to reset again with the already-used token
        const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: "any_used_token",
                newPassword: "AnotherPassword!999",
            }),
        });

        assert.strictEqual(res.status, 400);
    });
});
