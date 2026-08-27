require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");
const emailService = require("../services/emailService");
const realtimeService = require("../services/realtimeService");
const { getJwtSecret } = require("../config/jwtConfig");

test("CRYPTOSCOPE Secure Email OTP Password Reset Suite", async (t) => {
    await connectDB();
    assert.strictEqual(mongoose.connection.readyState, 1, "MongoDB Atlas must be connected");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    const testEmail = `otp_sec_test_${Date.now()}@cryptoscope.ai`;
    const initialPassword = "OldPassword@2026";
    const newPassword = "NewOtpPassword@2026!";
    const googleUserEmail = `google_only_${Date.now()}@cryptoscope.ai`;

    let userDoc = null;
    let googleUserDoc = null;
    let initialHash = null;
    let capturedOtp = null;

    try {
        // Setup Local Test User in MongoDB
        initialHash = await bcrypt.hash(initialPassword, 10);
        userDoc = await User.create({
            name: "OTP Test Analyst",
            email: testEmail,
            password: initialHash,
            role: "user",
            status: "active",
            authProvider: "local",
            refreshToken: "active_refresh_session_token_123",
        });

        // Setup Google-Only Test User in MongoDB
        googleUserDoc = await User.create({
            name: "Google Only User",
            email: googleUserEmail,
            googleId: `goog_${Date.now()}`,
            role: "user",
            status: "active",
            authProvider: "google",
        });

        // =========================================================================
        // Test 1: Nonexistent email receives generic response (Account Enumeration Protection)
        // =========================================================================
        await t.test("1. Nonexistent email receives generic response", async () => {
            const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "nonexistent_user_99999@cryptoscope.ai" }),
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.message.includes("If that email address is registered"));
        });

        // =========================================================================
        // Test 2: Google-only user receives generic response safely without OTP leak
        // =========================================================================
        await t.test("2. Google-only account handled safely without local password bypass", async () => {
            const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: googleUserEmail }),
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.message.includes("If that email address is registered"));

            const gUser = await User.findById(googleUserDoc._id);
            assert.strictEqual(gUser.resetPasswordOtp, null, "Google-only user should not have reset OTP set");
        });

        // =========================================================================
        // Test 3: Valid registered email generates 6-digit OTP, hashes it, and dispatches email
        // =========================================================================
        await t.test("3. Valid registered email generates 6-digit OTP & dispatches email", async () => {
            let emailSentTo = null;
            let emailOtpDispatched = null;

            const originalSendOtp = emailService.sendPasswordResetOtpEmail;
            emailService.sendPasswordResetOtpEmail = async function ({ to, name, otp }) {
                emailSentTo = to;
                emailOtpDispatched = otp;
                capturedOtp = otp;
                return { success: true, messageId: "mock_test_message_id" };
            };

            const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail }),
            });

            emailService.sendPasswordResetOtpEmail = originalSendOtp;

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.otp, undefined, "Raw OTP must NEVER be exposed in API response");
            assert.strictEqual(data.token, undefined, "Raw token must NEVER be exposed in API response");

            // Verify email delivery parameters
            assert.strictEqual(emailSentTo, testEmail, "Email must be dispatched to registered user");
            assert.ok(/^\d{6}$/.test(emailOtpDispatched), "OTP must be exactly 6 digits");

            // Verify MongoDB state: OTP must be stored ONLY as SHA-256 hash
            const refreshedUser = await User.findById(userDoc._id);
            assert.ok(refreshedUser.resetPasswordOtp, "Hashed OTP must exist in MongoDB");
            assert.notStrictEqual(refreshedUser.resetPasswordOtp, emailOtpDispatched, "MongoDB must NEVER store raw OTP");
            const expectedHash = crypto.createHash("sha256").update(emailOtpDispatched).digest("hex");
            assert.strictEqual(refreshedUser.resetPasswordOtp, expectedHash, "MongoDB must store SHA-256 hash of OTP");
            assert.ok(refreshedUser.resetPasswordOtpExpires > new Date(), "OTP expiry must be set in the future");
            assert.strictEqual(refreshedUser.resetPasswordOtpAttempts, 0, "OTP attempt counter must start at 0");

            // Verify activity logged
            const reqActivity = await UserActivity.findOne({
                userId: userDoc._id,
                action: "PASSWORD_RESET_REQUESTED",
            });
            assert.ok(reqActivity, "PASSWORD_RESET_REQUESTED activity must be recorded");
        });

        // =========================================================================
        // Test 4: Incorrect OTP rejected and increments attempt counter
        // =========================================================================
        await t.test("4. Incorrect OTP is rejected with remaining attempt count", async () => {
            const wrongOtp = capturedOtp === "111111" ? "222222" : "111111";

            const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, otp: wrongOtp }),
            });

            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("Incorrect OTP") || data.message.includes("attempt"));

            const u = await User.findById(userDoc._id);
            assert.strictEqual(u.resetPasswordOtpAttempts, 1, "Attempt counter must increment to 1");
        });

        // =========================================================================
        // Test 5: 5 failed OTP attempts invalidates OTP
        // =========================================================================
        await t.test("5. 5 failed OTP attempts invalidates the OTP", async () => {
            const wrongOtp = "999999";
            // Run 4 more failed attempts (reaching 5 total)
            for (let i = 2; i <= 5; i++) {
                await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: testEmail, otp: wrongOtp }),
                });
            }

            const u = await User.findById(userDoc._id);
            assert.strictEqual(u.resetPasswordOtp, null, "OTP must be invalidated after 5 failed attempts");
            assert.strictEqual(u.resetPasswordOtpExpires, null, "OTP expiry must be cleared");

            // Even genuine OTP is now rejected because it was invalidated
            const retryRes = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, otp: capturedOtp }),
            });
            assert.strictEqual(retryRes.status, 400);
        });

        // =========================================================================
        // Test 6: Expired OTP is rejected
        // =========================================================================
        await t.test("6. Expired OTP is rejected", async () => {
            // Generate a fresh OTP that is already expired
            const expiredOtp = "654321";
            const expiredHash = crypto.createHash("sha256").update(expiredOtp).digest("hex");
            await User.findByIdAndUpdate(userDoc._id, {
                resetPasswordOtp: expiredHash,
                resetPasswordOtpExpires: new Date(Date.now() - 1000), // In the past
                resetPasswordOtpAttempts: 0,
            });

            const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, otp: expiredOtp }),
            });

            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("expired") || data.message.includes("Invalid"));
        });

        // =========================================================================
        // Test 7: Correct OTP verification clears OTP and returns short-lived reset authorization token
        // =========================================================================
        let resetAuthToken = null;
        await t.test("7. Correct OTP verification clears OTP & issues reset authorization token", async () => {
            const validOtp = "789012";
            const validHash = crypto.createHash("sha256").update(validOtp).digest("hex");
            await User.findByIdAndUpdate(userDoc._id, {
                resetPasswordOtp: validHash,
                resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
                resetPasswordOtpAttempts: 0,
            });

            const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, otp: validOtp }),
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.resetToken, "Must return reset authorization token");
            resetAuthToken = data.resetToken;

            // Verify MongoDB: OTP fields cleared (Single Use) and resetPasswordToken hashed
            const u = await User.findById(userDoc._id);
            assert.strictEqual(u.resetPasswordOtp, null, "resetPasswordOtp must be cleared");
            assert.strictEqual(u.resetPasswordOtpExpires, null, "resetPasswordOtpExpires must be cleared");
            assert.ok(u.resetPasswordToken, "resetPasswordToken must be stored");
            const expectedTokenHash = crypto.createHash("sha256").update(resetAuthToken).digest("hex");
            assert.strictEqual(u.resetPasswordToken, expectedTokenHash, "resetPasswordToken must be SHA-256 hashed in DB");
            assert.ok(u.resetPasswordExpires > new Date(), "resetPasswordExpires must be in future");
        });

        // =========================================================================
        // Test 8: OTP cannot be reused after verification
        // =========================================================================
        await t.test("8. OTP cannot be reused after verification", async () => {
            const res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, otp: "789012" }),
            });

            assert.strictEqual(res.status, 400, "Reusing verified OTP must be rejected");
        });

        // =========================================================================
        // Test 9: Complete password reset with verified reset authorization token
        // =========================================================================
        await t.test("9. Password reset updates MongoDB, clears reset token, invalidates sessions, logs activity & emits realtime SSE", async () => {
            let capturedRealtime = false;
            let capturedTargetUser = null;
            const originalBroadcast = realtimeService.broadcast;
            realtimeService.broadcast = function (event, data, targetUserId) {
                if (event === "password_changed") {
                    capturedRealtime = true;
                    capturedTargetUser = targetUserId;
                }
                return originalBroadcast.apply(this, arguments);
            };

            const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resetToken: resetAuthToken,
                    newPassword,
                }),
            });

            realtimeService.broadcast = originalBroadcast;

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);

            // Verify MongoDB state
            const updatedUser = await User.findById(userDoc._id);
            assert.notStrictEqual(updatedUser.password, initialHash, "Password hash must change in DB");
            const isMatch = await bcrypt.compare(newPassword, updatedUser.password);
            assert.strictEqual(isMatch, true, "New password must match stored bcrypt hash");
            assert.strictEqual(updatedUser.resetPasswordToken, null, "resetPasswordToken must be cleared");
            assert.strictEqual(updatedUser.resetPasswordExpires, null, "resetPasswordExpires must be cleared");
            assert.strictEqual(updatedUser.refreshToken, null, "Existing refresh sessions must be invalidated (null)");
            assert.ok(updatedUser.passwordChangedAt, "passwordChangedAt timestamp must be recorded");

            // Verify Realtime SSE event
            assert.strictEqual(capturedRealtime, true, "password_changed realtime event must be emitted");
            assert.strictEqual(String(capturedTargetUser), String(userDoc._id), "Realtime target must be user ID");

            // Verify activity logged
            const act = await UserActivity.findOne({
                userId: userDoc._id,
                action: "PASSWORD_RESET_COMPLETED",
            });
            assert.ok(act, "PASSWORD_RESET_COMPLETED activity must be recorded");
            assert.strictEqual(act.status, "SUCCESS");
        });

        // =========================================================================
        // Test 10: Reset authorization token cannot be reused
        // =========================================================================
        await t.test("10. Reset authorization token cannot be reused", async () => {
            const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resetToken: resetAuthToken,
                    newPassword: "AnotherNewPassword@2026",
                }),
            });

            assert.strictEqual(res.status, 400, "Reset token reuse must be rejected");
        });

        // =========================================================================
        // Test 11: Login with old password fails & login with new password succeeds
        // =========================================================================
        await t.test("11. Login with old password fails and new password succeeds", async () => {
            const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, password: initialPassword }),
            });
            assert.strictEqual(oldLoginRes.status, 401, "Old password must fail login");

            const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail, password: newPassword }),
            });
            assert.strictEqual(newLoginRes.status, 200, "New password must succeed login");
            const newLoginData = await newLoginRes.json();
            assert.strictEqual(newLoginData.success, true);
            assert.ok(newLoginData.token, "Access token returned");
        });

    } finally {
        if (userDoc) {
            await User.deleteOne({ _id: userDoc._id });
            await UserActivity.deleteMany({ userId: userDoc._id });
        }
        if (googleUserDoc) {
            await User.deleteOne({ _id: googleUserDoc._id });
            await UserActivity.deleteMany({ userId: googleUserDoc._id });
        }
        server.close();
        setTimeout(() => process.exit(0), 500);
    }
});
