require("dotenv").config();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");

test("End-to-End Live HTTP Password Flow Simulation", async () => {
    await connectDB();
    const baseUrl = "http://localhost:3000";

    const testEmail = `e2e_live_${Date.now()}@cryptoscope.ai`;
    const initialPassword = "InitialPassword123!";
    const newPassword = "BrandNewSecurePassword123!";
    const wrongPassword = "WrongPassword999!";

    let userDoc = null;

    try {
        // 1. Register test user via live API
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "E2E Live Tester",
                email: testEmail,
                password: initialPassword,
            }),
        });

        assert.strictEqual(regRes.status, 201, "Registration should succeed");
        const regData = await regRes.json();
        assert.strictEqual(regData.success, true);
        const token = regData.token;
        const initialRefreshToken = regData.refreshToken;
        assert.ok(token, "Access token received");

        userDoc = await User.findOne({ email: testEmail });
        assert.ok(userDoc, "User found in MongoDB");
        const initialHash = userDoc.password;

        // 2. Fetch /api/auth/me (simulate profile page initial load)
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        assert.strictEqual(meRes.status, 200);
        const meData = await meRes.json();
        assert.strictEqual(meData.user.name, "E2E Live Tester");
        assert.strictEqual(meData.user.authProvider, "local");

        // 3. Attempt password change with INCORRECT current password
        const wrongPwdRes = await fetch(`${baseUrl}/api/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: "E2E Live Tester",
                currentPassword: wrongPassword,
                newPassword: newPassword,
            }),
        });

        assert.strictEqual(wrongPwdRes.status, 401, "Wrong current password must return 401");
        const wrongPwdData = await wrongPwdRes.json();
        assert.strictEqual(wrongPwdData.success, false);
        assert.strictEqual(wrongPwdData.message, "Current password is incorrect.");

        // Verify MongoDB state remains unchanged
        const unChangedUser = await User.findById(userDoc._id);
        assert.strictEqual(unChangedUser.password, initialHash, "Password hash must NOT change");
        assert.strictEqual(unChangedUser.passwordChangedAt, null, "passwordChangedAt must remain null");
        assert.ok(unChangedUser.refreshToken, "Session refresh token must remain intact");

        // 4. Attempt password change with CORRECT current password
        const correctPwdRes = await fetch(`${baseUrl}/api/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: "E2E Live Tester Updated",
                currentPassword: initialPassword,
                newPassword: newPassword,
            }),
        });

        assert.strictEqual(correctPwdRes.status, 200, "Valid password change must return 200");
        const correctPwdData = await correctPwdRes.json();
        assert.strictEqual(correctPwdData.success, true);
        assert.ok(correctPwdData.message.includes("Password changed successfully"));
        assert.strictEqual(correctPwdData.user.name, "E2E Live Tester Updated");

        // Verify MongoDB state is updated
        const changedUser = await User.findById(userDoc._id);
        assert.notStrictEqual(changedUser.password, initialHash, "Password hash must change in DB");
        const isBcryptMatch = await bcrypt.compare(newPassword, changedUser.password);
        assert.strictEqual(isBcryptMatch, true, "New password must match stored bcrypt hash");
        assert.ok(changedUser.passwordChangedAt, "passwordChangedAt must be recorded");
        assert.strictEqual(changedUser.refreshToken, null, "Existing refresh sessions must be invalidated");

        // Verify PASSWORD_CHANGED activity is recorded
        const act = await UserActivity.findOne({
            userId: userDoc._id,
            action: "PASSWORD_CHANGED",
        });
        assert.ok(act, "PASSWORD_CHANGED activity must exist");

        // 5. Test login with old password -> must fail (401)
        const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: initialPassword,
            }),
        });
        assert.strictEqual(oldLoginRes.status, 401, "Old password login must fail");

        // 6. Test login with new password -> must succeed (200)
        const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: newPassword,
            }),
        });
        assert.strictEqual(newLoginRes.status, 200, "New password login must succeed");
        const newLoginData = await newLoginRes.json();
        assert.strictEqual(newLoginData.success, true);
        assert.ok(newLoginData.token, "New login token provided");

    } finally {
        if (userDoc) {
            await User.deleteOne({ _id: userDoc._id });
            await UserActivity.deleteMany({ userId: userDoc._id });
        }
        setTimeout(() => process.exit(0), 500);
    }
});
