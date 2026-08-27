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
const realtimeService = require("../services/realtimeService");
const { getJwtSecret } = require("../config/jwtConfig");

test("CRYPTOSCOPE Password-Change Authorization & Security Suite", async (t) => {
    await connectDB();
    assert.strictEqual(mongoose.connection.readyState, 1, "MongoDB Atlas must be connected");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    // Test Variables
    const testEmail = `pwd_sec_${Date.now()}@cryptoscope.ai`;
    const initialPassword = "InitialPassword@2026";
    const newPassword = "UpdatedSecurePassword@2026!";
    const wrongPassword = "WrongPassword@9999";
    const googleUserEmail = `google_auth_sec_${Date.now()}@cryptoscope.ai`;

    let userDoc = null;
    let googleUserDoc = null;
    let initialPasswordHash = null;
    let userAccessToken = null;
    let userRefreshToken = null;
    let googleAccessToken = null;

    try {
        // Setup Local Test User
        initialPasswordHash = await bcrypt.hash(initialPassword, 10);
        userDoc = await User.create({
            name: "Password Sec Tester",
            email: testEmail,
            password: initialPasswordHash,
            role: "user",
            status: "active",
            authProvider: "local",
        });

        // Setup Google-Only Test User (No local password)
        googleUserDoc = await User.create({
            name: "Google OAuth User",
            email: googleUserEmail,
            googleId: `google_id_${Date.now()}`,
            role: "user",
            status: "active",
            authProvider: "google",
        });

        // Generate Access & Refresh Tokens for local user
        const secret = getJwtSecret();
        userAccessToken = jwt.sign(
            { id: userDoc._id.toString(), email: userDoc.email, role: userDoc.role },
            secret,
            { expiresIn: "1h" }
        );
        const rawRefreshToken = "test_refresh_token_nonce_12345";
        userRefreshToken = rawRefreshToken;
        const hashedRefreshToken = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
        userDoc.refreshToken = hashedRefreshToken;
        await userDoc.save();

        // Generate Access Token for Google-only user
        googleAccessToken = jwt.sign(
            { id: googleUserDoc._id.toString(), email: googleUserDoc.email, role: googleUserDoc.role },
            secret,
            { expiresIn: "1h" }
        );

        // =========================================================================
        // Test 1: Wrong current password + valid new password -> 401 & unchanged
        // =========================================================================
        await t.test("1. Wrong current password -> 401 and password remains unchanged", async () => {
            let capturedRealtime = false;
            const originalBroadcast = realtimeService.broadcast;
            realtimeService.broadcast = function (event, data, targetUserId) {
                if (event === "password_changed") capturedRealtime = true;
                return originalBroadcast.apply(this, arguments);
            };

            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    name: "Updated Name Attempt",
                    currentPassword: wrongPassword,
                    newPassword: newPassword,
                }),
            });

            realtimeService.broadcast = originalBroadcast;

            assert.strictEqual(res.status, 401, "Wrong current password must return HTTP 401");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.message, "Current password is incorrect.");

            // Verify MongoDB state is completely unchanged
            const freshUser = await User.findById(userDoc._id);
            assert.strictEqual(freshUser.password, initialPasswordHash, "Password hash in MongoDB must NOT change");
            assert.strictEqual(freshUser.passwordChangedAt, null, "passwordChangedAt must remain null");
            assert.strictEqual(freshUser.refreshToken, hashedRefreshToken, "Session refresh token must NOT be invalidated");
            assert.strictEqual(capturedRealtime, false, "Realtime password_changed event must NOT be emitted");

            // Verify no PASSWORD_CHANGED activity logged
            const failedActivity = await UserActivity.findOne({
                userId: userDoc._id,
                action: "PASSWORD_CHANGED",
            });
            assert.strictEqual(failedActivity, null, "No PASSWORD_CHANGED activity should be recorded on failed attempt");
        });

        // =========================================================================
        // Test 2: Empty current password -> 400 rejected
        // =========================================================================
        await t.test("2. Empty current password -> 400 rejected", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "",
                    newPassword: newPassword,
                }),
            });

            assert.strictEqual(res.status, 400, "Empty current password must return HTTP 400");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("Current password is required"));
        });

        // =========================================================================
        // Test 3: Empty new password -> 400 rejected
        // =========================================================================
        await t.test("3. Empty new password -> 400 rejected", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: initialPassword,
                    newPassword: "",
                }),
            });

            assert.strictEqual(res.status, 400, "Empty new password must return HTTP 400");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("New password must be at least 6 characters"));
        });

        // =========================================================================
        // Test 4: Invalid new password (< 6 chars) -> 400 rejected
        // =========================================================================
        await t.test("4. Invalid new password (< 6 chars) -> 400 rejected", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: initialPassword,
                    newPassword: "123",
                }),
            });

            assert.strictEqual(res.status, 400, "Short new password must return HTTP 400");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("New password must be at least 6 characters"));
        });

        // =========================================================================
        // Test 5: New password equal to current password -> 400 rejected
        // =========================================================================
        await t.test("5. New password equal to current password -> 400 rejected", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: initialPassword,
                    newPassword: initialPassword,
                }),
            });

            assert.strictEqual(res.status, 400, "Identical new password must return HTTP 400");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("cannot be the same as the current password"));
        });

        // =========================================================================
        // Test 6: Normal profile/name update without password -> 200 SUCCESS
        // =========================================================================
        await t.test("6. Display name update without password -> 200 SUCCESS", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    name: "Updated Display Name",
                }),
            });

            assert.strictEqual(res.status, 200, "Name update without password must succeed");
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.user.name, "Updated Display Name");

            const checkUser = await User.findById(userDoc._id);
            assert.strictEqual(checkUser.name, "Updated Display Name");
            assert.strictEqual(checkUser.password, initialPasswordHash, "Password must remain unchanged");
        });

        // =========================================================================
        // Test 7: Correct current password + valid new password -> 200 SUCCESS
        // =========================================================================
        await t.test("7. Correct current password + valid new password -> 200 SUCCESS", async () => {
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

            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    name: "Final Name",
                    currentPassword: initialPassword,
                    newPassword: newPassword,
                }),
            });

            realtimeService.broadcast = originalBroadcast;

            assert.strictEqual(res.status, 200, "Valid password change must return HTTP 200");
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.message.includes("Password changed successfully"));

            // Verify MongoDB State
            const updatedUser = await User.findById(userDoc._id);
            assert.notStrictEqual(updatedUser.password, initialPasswordHash, "Password hash must be updated in MongoDB");
            const isNewMatch = await bcrypt.compare(newPassword, updatedUser.password);
            assert.strictEqual(isNewMatch, true, "Stored bcrypt hash must match new password");
            assert.ok(updatedUser.passwordChangedAt, "passwordChangedAt timestamp must be set");
            assert.strictEqual(updatedUser.refreshToken, null, "Refresh session token must be invalidated (set to null)");
            assert.strictEqual(capturedRealtime, true, "Realtime password_changed SSE event must be broadcast");
            assert.strictEqual(String(capturedTargetUser), String(userDoc._id), "Realtime event target must be the user ID");

            // Verify PASSWORD_CHANGED activity logged in MongoDB
            const act = await UserActivity.findOne({
                userId: userDoc._id,
                action: "PASSWORD_CHANGED",
            });
            assert.ok(act, "PASSWORD_CHANGED activity must be recorded in MongoDB");
            assert.strictEqual(act.status, "SUCCESS");
        });

        // =========================================================================
        // Test 8: Old password after successful change -> login fails (401)
        // =========================================================================
        await t.test("8. Login with old password fails (401)", async () => {
            const res = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testEmail,
                    password: initialPassword,
                }),
            });

            assert.strictEqual(res.status, 401, "Old password must be rejected");
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        // =========================================================================
        // Test 9: New password after successful change -> login succeeds (200)
        // =========================================================================
        await t.test("9. Login with new password succeeds (200)", async () => {
            const res = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: testEmail,
                    password: newPassword,
                }),
            });

            assert.strictEqual(res.status, 200, "New password must authenticate successfully");
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.token, "Must return new JWT access token");
            assert.ok(data.refreshToken, "Must return new refresh token");
        });

        // =========================================================================
        // Test 10: Old refresh token reuse -> 401 rejected
        // =========================================================================
        await t.test("10. Invalidate old refresh session credentials", async () => {
            const res = await fetch(`${baseUrl}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    refreshToken: jwt.sign({ id: userDoc._id.toString() }, secret, { expiresIn: "7d" }),
                }),
            });

            assert.strictEqual(res.status, 401, "Invalidated refresh token must be rejected with 401");
        });

        // =========================================================================
        // Test 11: Google-only user password change -> 400 rejected safely
        // =========================================================================
        await t.test("11. Google-only user password change is safely rejected", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${googleAccessToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "SomePassword123!",
                    newPassword: "AnotherPassword123!",
                }),
            });

            assert.strictEqual(res.status, 400, "Google user password change must be rejected with 400");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.message.includes("Google"), "Message must explain account is authenticated via Google");

            const gUser = await User.findById(googleUserDoc._id);
            assert.strictEqual(gUser.password, undefined, "Google user must not have a local password set");
        });

        // =========================================================================
        // Test 12: Google-only user can update display name -> 200 SUCCESS
        // =========================================================================
        await t.test("12. Google-only user can update display name", async () => {
            const res = await fetch(`${baseUrl}/api/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${googleAccessToken}`,
                },
                body: JSON.stringify({
                    name: "Google Analyst Updated",
                }),
            });

            assert.strictEqual(res.status, 200, "Google user name update must succeed");
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.user.name, "Google Analyst Updated");
        });

        // =========================================================================
        // Test 13: Google OAuth redirect remains functional
        // =========================================================================
        await t.test("13. Google OAuth endpoint remains functional", async () => {
            const res = await fetch(`${baseUrl}/api/auth/google`, { redirect: "manual" });
            assert.strictEqual(res.status, 302, "Google redirect endpoint must return 302");
        });

        // =========================================================================
        // Test 14: Forgot password flow remains functional
        // =========================================================================
        await t.test("14. Forgot password flow remains functional", async () => {
            const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: testEmail }),
            });

            assert.strictEqual(res.status, 200, "Forgot password endpoint must return 200");
            const data = await res.json();
            assert.strictEqual(data.success, true);
        });

        // =========================================================================
        // Test 15: Admin authorization remains functional
        // =========================================================================
        await t.test("15. Admin authorization remains functional", async () => {
            const adminToken = jwt.sign(
                { id: new mongoose.Types.ObjectId().toString(), email: "admin@cryptoscope.ai", role: "admin" },
                secret,
                { expiresIn: "1h" }
            );

            const res = await fetch(`${baseUrl}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });

            assert.strictEqual(res.status, 200, "Admin stats endpoint must return 200 for admin token");
            const data = await res.json();
            assert.strictEqual(data.success, true);
        });

    } finally {
        // Clean up test records
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
