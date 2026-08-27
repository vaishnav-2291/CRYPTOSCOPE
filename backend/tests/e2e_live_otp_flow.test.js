require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");

test("End-to-End Live HTTP Email OTP Password Reset Flow", async () => {
    await connectDB();
    const baseUrl = "http://localhost:3000";

    const testEmail = `e2e_otp_live_${Date.now()}@cryptoscope.ai`;
    const initialPassword = "InitialPassword123!";
    const newPassword = "NewBrandNewPassword123!";

    let userDoc = null;

    try {
        // 1. Register test user via live API
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Live OTP Tester",
                email: testEmail,
                password: initialPassword,
            }),
        });

        assert.strictEqual(regRes.status, 201, "Registration should succeed");
        const regData = await regRes.json();
        assert.strictEqual(regData.success, true);
        const token = regData.token;

        userDoc = await User.findOne({ email: testEmail });
        assert.ok(userDoc, "User found in MongoDB");

        // 2. Request OTP via POST /api/auth/forgot-password
        const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail }),
        });

        assert.strictEqual(forgotRes.status, 200, "Forgot password endpoint returns 200");
        const forgotData = await forgotRes.json();
        assert.strictEqual(forgotData.success, true);
        assert.ok(forgotData.message.includes("If that email address is registered"));
        assert.strictEqual(forgotData.otp, undefined, "Raw OTP must not be leaked in response");

        // Retrieve the generated hashed OTP from MongoDB
        const updatedUser = await User.findById(userDoc._id);
        assert.ok(updatedUser.resetPasswordOtp, "Hashed OTP exists in MongoDB");
        assert.ok(updatedUser.resetPasswordOtpExpires > new Date(), "OTP expiry in future");
        const storedHashedOtp = updatedUser.resetPasswordOtp;

        // 3. Test wrong OTP rejection via POST /api/auth/verify-reset-otp
        const wrongOtpRes = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, otp: "000000" }),
        });
        assert.strictEqual(wrongOtpRes.status, 400, "Wrong OTP returns 400");
        const wrongOtpData = await wrongOtpRes.json();
        assert.strictEqual(wrongOtpData.success, false);

        // 4. We simulate extracting the genuine OTP by setting a known 6-digit OTP in MongoDB for deterministic live verification
        const testOtp = "842915";
        const testOtpHashed = crypto.createHash("sha256").update(testOtp).digest("hex");
        await User.findByIdAndUpdate(userDoc._id, {
            resetPasswordOtp: testOtpHashed,
            resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
            resetPasswordOtpAttempts: 0,
        });

        // 5. Verify genuine OTP via POST /api/auth/verify-reset-otp
        const verifyRes = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, otp: testOtp }),
        });
        assert.strictEqual(verifyRes.status, 200, "Valid OTP verification returns 200");
        const verifyData = await verifyRes.json();
        assert.strictEqual(verifyData.success, true);
        assert.ok(verifyData.resetToken, "Reset authorization token received");
        const resetToken = verifyData.resetToken;

        // 6. Complete password reset via POST /api/auth/reset-password
        const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resetToken,
                newPassword,
            }),
        });

        assert.strictEqual(resetRes.status, 200, "Reset password returns 200");
        const resetData = await resetRes.json();
        assert.strictEqual(resetData.success, true);

        // 7. Verify MongoDB state after password reset
        const finalUser = await User.findById(userDoc._id);
        const isBcryptMatch = await bcrypt.compare(newPassword, finalUser.password);
        assert.strictEqual(isBcryptMatch, true, "New password matches MongoDB bcrypt hash");
        assert.strictEqual(finalUser.resetPasswordToken, null, "resetPasswordToken cleared");
        assert.strictEqual(finalUser.resetPasswordOtp, null, "resetPasswordOtp cleared");
        assert.strictEqual(finalUser.refreshToken, null, "Refresh session invalidated");
        assert.ok(finalUser.passwordChangedAt, "passwordChangedAt recorded");

        // 8. Test old password fails login
        const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: initialPassword }),
        });
        assert.strictEqual(oldLoginRes.status, 401, "Old password fails login");

        // 9. Test new password succeeds login
        const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testEmail, password: newPassword }),
        });
        assert.strictEqual(newLoginRes.status, 200, "New password succeeds login");
        const newLoginData = await newLoginRes.json();
        assert.strictEqual(newLoginData.success, true);
        assert.ok(newLoginData.token, "Access token received");

    } finally {
        if (userDoc) {
            await User.deleteOne({ _id: userDoc._id });
            await UserActivity.deleteMany({ userId: userDoc._id });
        }
        setTimeout(() => process.exit(0), 500);
    }
});
