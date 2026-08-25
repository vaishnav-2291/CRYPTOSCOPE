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

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";

test("Admin Authentication & Authorization Security Test Suite", async (t) => {
    let connected = await connectDB();
    if (!connected) {
        await new Promise((r) => setTimeout(r, 1000));
        connected = await connectDB();
    }
    assert.strictEqual(mongoose.connection.readyState, 1, "MongoDB Atlas must be connected");

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    const adminEmail = `verified_admin_${Date.now()}@cryptoscope.ai`;
    const adminPassword = "AdminCorrectPass@2026!";
    const userEmail = `standard_user_${Date.now()}@cryptoscope.ai`;
    const userPassword = "UserCorrectPass@2026!";
    const googleUserEmail = `google_user_${Date.now()}@cryptoscope.ai`;

    let adminDoc = null;
    let userDoc = null;
    let googleUserDoc = null;
    let adminToken = null;
    let userToken = null;
    let googleUserToken = null;

    // Bootstrap test accounts
    await t.test("Bootstrap test accounts in MongoDB", async () => {
        const hashedAdminPass = await bcrypt.hash(adminPassword, 10);
        adminDoc = await User.create({
            name: "Verified Administrator",
            email: adminEmail,
            password: hashedAdminPass,
            role: "admin",
            status: "active",
            authProvider: "local",
        });
        assert.strictEqual(adminDoc.role, "admin");

        const hashedUserPass = await bcrypt.hash(userPassword, 10);
        userDoc = await User.create({
            name: "Standard Analyst",
            email: userEmail,
            password: hashedUserPass,
            role: "user",
            status: "active",
            authProvider: "local",
        });
        assert.strictEqual(userDoc.role, "user");

        googleUserDoc = await User.create({
            name: "Google Authenticated User",
            email: googleUserEmail,
            googleId: `google_oauth_${Date.now()}`,
            role: "user",
            status: "active",
            authProvider: "google",
        });
        assert.strictEqual(googleUserDoc.role, "user");
    });

    // Test 1: Existing valid admin email + correct password -> LOGIN SUCCESS
    await t.test("Test 1: Existing valid admin email + correct password -> LOGIN SUCCESS", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);
        assert.ok(data.token);
        assert.strictEqual(data.user.role, "admin");
        adminToken = data.token;

        // Verify decoded token role
        const decoded = jwt.verify(adminToken, JWT_SECRET);
        assert.strictEqual(decoded.role, "admin");
    });

    // Test 2: Existing valid admin email + WRONG password -> LOGIN FAILURE -> 401
    await t.test("Test 2: Existing valid admin email + WRONG password -> LOGIN FAILURE (401)", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, password: "IncorrectPassword123!" }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 401);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, "Invalid email or password.");
        assert.strictEqual(data.token, undefined);
    });

    // Test 3: Non-admin user email + correct password -> LOGIN as normal user -> ADMIN ACCESS DENIED (403)
    await t.test("Test 3: Non-admin user email + correct password -> LOGIN as user -> ADMIN ACCESS DENIED (403)", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, password: userPassword }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.role, "user");
        userToken = data.token;

        // Attempt to access admin endpoints with userToken -> 403 Forbidden
        const adminRes = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        assert.strictEqual(adminRes.status, 403);
        const adminData = await adminRes.json();
        assert.strictEqual(adminData.success, false);
        assert.strictEqual(adminData.message, "Access denied. Administrator privileges required.");
    });

    // Test 4: Non-admin user email + wrong password -> LOGIN FAILURE (401)
    await t.test("Test 4: Non-admin user email + wrong password -> LOGIN FAILURE (401)", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, password: "WrongUserPassword999!" }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 401);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, "Invalid email or password.");
    });

    // Test 5: Random/nonexistent email + any password -> LOGIN FAILURE (401) -> do NOT create account
    await t.test("Test 5: Random/nonexistent email + any password -> LOGIN FAILURE (401) -> No account created", async () => {
        const nonexistentEmail = `ghost_user_${Date.now()}@cryptoscope.ai`;
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: nonexistentEmail, password: "ArbitraryPassword123!" }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 401);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, "Invalid email or password.");

        // Verify in MongoDB that no ghost user was created
        const dbCheck = await User.findOne({ email: nonexistentEmail });
        assert.strictEqual(dbCheck, null, "Database must NOT have created an account on failed login");
    });

    // Test 6: Random email + "admin" role in public registration -> account must NOT become admin
    await t.test("Test 6: Random email + 'admin' role in public registration -> Must NOT become admin", async () => {
        const attackEmail = `attacker_reg_${Date.now()}@cryptoscope.ai`;
        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Attacker Trying Escalation",
                email: attackEmail,
                password: "AttackerPassword@2026",
                role: "admin",
                isAdmin: true,
            }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(data.user.role, "user", "Public registration must assign role 'user'");

        // Verify directly in MongoDB Atlas
        const createdUser = await User.findOne({ email: attackEmail });
        assert.ok(createdUser);
        assert.strictEqual(createdUser.role, "user", "MongoDB document role must be 'user'");

        // Test admin access with this attacker's token -> 403
        const adminTry = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${data.token}` },
        });
        assert.strictEqual(adminTry.status, 403);

        await User.deleteOne({ _id: createdUser._id });
    });

    // Test 7: Non-admin modifies profile/request to send role=admin -> backend ignores it
    await t.test("Test 7: Non-admin profile update with role=admin -> backend ignores role change", async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify({
                name: "Standard Analyst Renamed",
                role: "admin",
                isAdmin: true,
            }),
        });
        const data = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(data.user.role, "user");

        // Verify in DB
        const recheckUser = await User.findById(userDoc._id);
        assert.strictEqual(recheckUser.role, "user", "DB role must remain 'user'");
    });

    // Test 8: Non-admin directly requests all /api/admin/* endpoints -> 403
    await t.test("Test 8: Non-admin directly requests all /api/admin/* routes -> 403 Forbidden", async () => {
        const endpoints = ["/api/admin/stats", "/api/admin/entities", "/api/admin/scans", "/api/admin/activities"];
        for (const ep of endpoints) {
            const res = await fetch(`${baseUrl}${ep}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            assert.strictEqual(res.status, 403, `Endpoint ${ep} must return 403 for non-admin`);
        }
    });

    // Test 9: Unauthenticated request to /api/admin/* -> 401 Unauthorized
    await t.test("Test 9: Unauthenticated request to /api/admin/* -> 401 Unauthorized", async () => {
        const endpoints = ["/api/admin/stats", "/api/admin/entities", "/api/admin/scans", "/api/admin/activities"];
        for (const ep of endpoints) {
            const res = await fetch(`${baseUrl}${ep}`);
            assert.strictEqual(res.status, 401, `Endpoint ${ep} must return 401 when unauthenticated`);
        }
    });

    // Test 10: Google-authenticated normal user -> admin API access DENIED (403)
    await t.test("Test 10: Google-authenticated normal user -> admin API access DENIED (403)", async () => {
        // Generate tokens for google user
        googleUserToken = jwt.sign(
            { id: googleUserDoc._id.toString(), email: googleUserDoc.email, role: googleUserDoc.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        const res = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${googleUserToken}` },
        });
        assert.strictEqual(res.status, 403, "Google authenticated user with role 'user' must receive 403");
    });

    // Test 11: Existing admin changes password -> new password works, old fails, role remains admin
    await t.test("Test 11: Existing admin resets password -> new works, old fails, role remains admin", async () => {
        // Step 1: Request reset
        await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail }),
        });

        // Step 2: Grab token from DB
        const updatedAdmin = await User.findOne({ email: adminEmail });
        assert.ok(updatedAdmin.resetPasswordToken);

        // Generate raw token match
        const rawToken = "custom_test_admin_reset_token_2026_xyz";
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        updatedAdmin.resetPasswordToken = hashedToken;
        updatedAdmin.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await updatedAdmin.save();

        const newAdminPass = "BrandNewAdminPassword#2026!";

        // Step 3: Perform reset
        const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: rawToken, newPassword: newAdminPass }),
        });
        assert.strictEqual(resetRes.status, 200);

        // Step 4: Old password must fail (401)
        const oldLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });
        assert.strictEqual(oldLogin.status, 401, "Old admin password must fail");

        // Step 5: New password must succeed (200) and role remains admin
        const newLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, password: newAdminPass }),
        });
        assert.strictEqual(newLogin.status, 200, "New admin password must succeed");
        const newLoginData = await newLogin.json();
        assert.strictEqual(newLoginData.user.role, "admin", "Admin role must be preserved across password resets");

        // Step 6: Verify admin API access with new token
        const adminAccess = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${newLoginData.token}` },
        });
        assert.strictEqual(adminAccess.status, 200, "New admin token must grant access to admin API");
    });

    // Test 12: Logout / Invalid token access -> Denied (401)
    await t.test("Test 12: Invalidated token / Invalid token accessing admin API -> Denied (401)", async () => {
        const forgedToken = jwt.sign({ id: userDoc._id.toString(), email: userDoc.email, role: "admin" }, "fake_wrong_secret");
        const res = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${forgedToken}` },
        });
        assert.strictEqual(res.status, 401, "Forged token with wrong signature must be rejected with 401");
    });

    // Test 13: Suspended account cannot login
    await t.test("Test 13: Suspended account login -> 403 Forbidden", async () => {
        const suspendedEmail = `suspended_user_${Date.now()}@cryptoscope.ai`;
        const suspendedPass = "SuspendedPass@2026!";
        const hashed = await bcrypt.hash(suspendedPass, 10);
        const suspUser = await User.create({
            name: "Suspended Account",
            email: suspendedEmail,
            password: hashed,
            role: "user",
            status: "suspended",
        });

        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: suspendedEmail, password: suspendedPass }),
        });
        assert.strictEqual(res.status, 403);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes("suspended"));

        await User.deleteOne({ _id: suspUser._id });
    });

    // Cleanup
    await User.deleteMany({ _id: { $in: [adminDoc._id, userDoc._id, googleUserDoc._id] } });
    await UserActivity.deleteMany({ userId: { $in: [adminDoc._id, userDoc._id, googleUserDoc._id] } });

    server.close();
    setTimeout(() => process.exit(0), 500);
});
