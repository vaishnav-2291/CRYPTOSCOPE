require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");
const realtimeService = require("../services/realtimeService");

test("Password Reset Security & MongoDB Persistence Flow", async () => {
    await connectDB();
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
        // Setup a distinct test user in MongoDB
        const isDbConnected = mongoose.connection.readyState === 1;
        assert.strictEqual(isDbConnected, true, "MongoDB Atlas must be connected for persistent verification");


        const testEmail = `sec_analyst_${Date.now()}@cryptoscope.ai`;
        const initialPassword = "OldPassword@2026";
        const newPassword = "NewSecurePassword@2026!";

        const initialHash = await bcrypt.hash(initialPassword, 10);
        const user = await User.create({
            name: "Security Tester",
            email: testEmail,
            password: initialHash,
            role: "user",
            refreshToken: "active_refresh_token_session_12345",
        });

        assert.ok(user._id, "Test user created in MongoDB");

        // -------------------------------------------------------------
        // Step 1: Request forgot password
        // -------------------------------------------------------------
        const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail }),
        });

        assert.strictEqual(forgotRes.status, 200, "Forgot password endpoint should return 200");
        const forgotData = await forgotRes.json();
        assert.strictEqual(forgotData.success, true);
        assert.strictEqual(
            forgotData.resetToken,
            undefined,
            "CRITICAL SECURITY: Raw reset token must NEVER be returned in API response"
        );
        assert.ok(
            forgotData.message.includes("If that email address is registered"),
            "Response message should be generic to prevent account enumeration"
        );

        // -------------------------------------------------------------
        // Step 2: Verify MongoDB state after forgot password
        // -------------------------------------------------------------
        const updatedUser = await User.findById(user._id);
        assert.ok(updatedUser.resetPasswordOtp, "MongoDB must store the hashed OTP");
        assert.ok(updatedUser.resetPasswordOtpExpires > new Date(), "OTP expiry must be in the future");

        // Verify activity logged
        const reqActivity = await UserActivity.findOne({
            userId: user._id,
            action: "PASSWORD_RESET_REQUESTED",
        });
        assert.ok(reqActivity, "PASSWORD_RESET_REQUESTED activity must be recorded in MongoDB");

        // -------------------------------------------------------------
        // Step 3: Attempt reset with invalid/tampered token (Must Fail)
        // -------------------------------------------------------------
        const invalidResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: "invalid_fake_token_abcdef123456",
                newPassword,
            }),
        });
        assert.strictEqual(invalidResetRes.status, 400, "Reset with invalid token must fail with 400");

        // -------------------------------------------------------------
        // Step 4: Complete reset using genuine token
        // (We generate raw token that hashes to updatedUser.resetPasswordToken for testing)
        // -------------------------------------------------------------
        const testRawToken = "test_raw_reset_token_64_bytes_secure_value_xyz";
        const testHashedToken = crypto.createHash("sha256").update(testRawToken).digest("hex");
        updatedUser.resetPasswordToken = testHashedToken;
        updatedUser.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await updatedUser.save();

        let realtimeEventCaptured = false;
        const originalBroadcast = realtimeService.broadcast;
        realtimeService.broadcast = function (event, data, targetUserId) {
            if (event === "password_changed" && String(targetUserId) === String(user._id)) {
                realtimeEventCaptured = true;
            }
            return originalBroadcast.apply(this, arguments);
        };

        const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: testRawToken,
                newPassword,
            }),
        });

        realtimeService.broadcast = originalBroadcast;

        assert.strictEqual(resetRes.status, 200, "Reset with valid token must succeed");
        const resetData = await resetRes.json();
        assert.strictEqual(resetData.success, true);

        // -------------------------------------------------------------
        // Step 5: Verify MongoDB changes immediately reflected
        // -------------------------------------------------------------
        const resetUser = await User.findById(user._id);
        assert.notStrictEqual(resetUser.password, initialHash, "Password hash must change in MongoDB");
        assert.strictEqual(resetUser.resetPasswordToken, null, "Reset token must be cleared in MongoDB");
        assert.strictEqual(resetUser.resetPasswordExpires, null, "Reset token expiry must be cleared in MongoDB");
        assert.strictEqual(resetUser.refreshToken, null, "Active session refresh token must be invalidated");
        assert.ok(realtimeEventCaptured, "password_changed realtime SSE event must be broadcast");

        // Verify PASSWORD_RESET_COMPLETED activity logged
        const completeActivity = await UserActivity.findOne({
            userId: user._id,
            action: "PASSWORD_RESET_COMPLETED",
        });
        assert.ok(completeActivity, "PASSWORD_RESET_COMPLETED activity must be recorded in MongoDB");

        // -------------------------------------------------------------
        // Step 6: Verify old token CANNOT be reused
        // -------------------------------------------------------------
        const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: testRawToken,
                newPassword: "AnotherPassword@2026",
            }),
        });
        assert.strictEqual(reuseRes.status, 400, "Old reset token reuse must be rejected with 400");

        // -------------------------------------------------------------
        // Step 7: Verify old password no longer works
        // -------------------------------------------------------------
        const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: initialPassword,
            }),
        });
        assert.strictEqual(oldLoginRes.status, 401, "Old password must be rejected");

        // -------------------------------------------------------------
        // Step 8: Verify new password works immediately
        // -------------------------------------------------------------
        const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: newPassword,
            }),
        });
        assert.strictEqual(newLoginRes.status, 200, "New password must authenticate successfully");
        const newLoginData = await newLoginRes.json();
        assert.strictEqual(newLoginData.success, true);
        assert.ok(newLoginData.token, "Must return valid access token");

        // Cleanup
        await User.deleteOne({ _id: user._id });
        await UserActivity.deleteMany({ userId: user._id });
    } finally {
        server.close();
        setTimeout(() => process.exit(0), 500);
    }
});
