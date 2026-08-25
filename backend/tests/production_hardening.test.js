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
const Wallet = require("../models/walletModel");
const UserActivity = require("../models/activityModel");
const SecurityAlert = require("../models/alertModel");
const marketService = require("../services/marketService");
const newsService = require("../services/newsService");

test("Production Hardening & Verification Suite", async (t) => {
    await connectDB();
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    let userAToken = null;
    let userBToken = null;
    let adminToken = null;
    let userAId = null;
    let userBId = null;
    let adminId = null;

    const emailA = `analyst_a_${Date.now()}@cryptoscope.ai`;
    const emailB = `analyst_b_${Date.now()}@cryptoscope.ai`;
    const emailAdmin = `secops_admin_${Date.now()}@cryptoscope.ai`;
    const password = "StrongPassword@2026!";

    // Setup accounts
    await t.test("1. Setup Test Accounts in MongoDB", async () => {
        // Register User A
        const resA = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Analyst A", email: emailA, password, role: "user" }),
        });
        const dataA = await resA.json();
        assert.strictEqual(resA.status, 201);
        assert.ok(dataA.token);
        userAToken = dataA.token;
        userAId = dataA.user.id;

        // Register User B
        const resB = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Analyst B", email: emailB, password, role: "user" }),
        });
        const dataB = await resB.json();
        assert.strictEqual(resB.status, 201);
        assert.ok(dataB.token);
        userBToken = dataB.token;
        userBId = dataB.user.id;

        // Create Admin user directly in DB
        const hashedPassword = await bcrypt.hash(password, 10);
        const adminDoc = await User.create({
            name: "SecOps Admin",
            email: emailAdmin,
            password: hashedPassword,
            role: "admin",
        });
        adminId = adminDoc._id.toString();

        // Login Admin to get Token
        const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailAdmin, password }),
        });
        const dataAdmin = await resAdmin.json();
        assert.strictEqual(resAdmin.status, 200);
        assert.ok(dataAdmin.token);
        adminToken = dataAdmin.token;
    });

    // 2. Authentication Verification
    await t.test("2. Authentication - Email/password, Invalid Credentials, Logout", async () => {
        // Invalid login attempt
        const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailA, password: "WrongPassword@123" }),
        });
        assert.strictEqual(badLogin.status, 401);

        // Valid login
        const goodLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailA, password }),
        });
        assert.strictEqual(goodLogin.status, 200);
        const loginData = await goodLogin.json();
        assert.strictEqual(loginData.success, true);
        assert.ok(loginData.token);

        // Me endpoint
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.strictEqual(meRes.status, 200);
        const meData = await meRes.json();
        assert.strictEqual(meData.user.email, emailA);
    });

    // 3. Strict User Isolation (IDOR Checks)
    await t.test("3. Strict User Isolation - User A data is unreachable by User B", async () => {
        // User A adds a wallet to watchlist
        const addWatchA = await fetch(`${baseUrl}/api/wallet/watchlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({
                address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                label: "User A Confidential Genesis Watch",
            }),
        });
        assert.strictEqual(addWatchA.status, 200);

        // User B fetches their watchlist -> MUST be empty
        const watchB = await fetch(`${baseUrl}/api/wallet/watchlist`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        const dataWatchB = await watchB.json();
        assert.strictEqual(dataWatchB.watchlist.length, 0, "User B must have 0 items in watchlist");

        // User A scan history -> Create scan under User A
        const scanA = await Wallet.create({
            user: userAId,
            address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            network: "bitcoin",
            balance: 50.0,
            riskScore: 10,
            riskLevel: "Low",
        });

        // User B fetches scan history -> MUST NOT contain User A's scan
        const historyB = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        const dataHistB = await historyB.json();
        const foundAInB = dataHistB.history.some((h) => h.user === userAId || h.address === scanA.address);
        assert.strictEqual(foundAInB, false, "User B must not see User A's scan history");

        // User B user activities -> MUST NOT contain User A's activities
        const actB = await fetch(`${baseUrl}/api/wallet/activities`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        const dataActB = await actB.json();
        const foundActAInB = dataActB.activities.some((a) => a.userId === userAId);
        assert.strictEqual(foundActAInB, false, "User B must not see User A's user activities");
    });

    // 4. Strict Admin RBAC
    await t.test("4. Strict Admin RBAC - Non-admin receives 403, Admin receives 200", async () => {
        // Normal User A attempts to access /api/admin/stats -> 403 Forbidden
        const userAccessAdmin = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.strictEqual(userAccessAdmin.status, 403, "Normal user must receive 403 Forbidden on admin stats");

        // Unauthenticated access -> 401 Unauthorized
        const unauthAccess = await fetch(`${baseUrl}/api/admin/stats`);
        assert.strictEqual(unauthAccess.status, 401, "Unauthenticated request must receive 401");

        // Normal User A attempts to trigger simulated alert -> 403 Forbidden
        const simAttempt = await fetch(`${baseUrl}/api/wallet/alerts/simulate`, {
            method: "POST",
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.strictEqual(simAttempt.status, 403, "Normal user cannot simulate alerts");

        // Admin accesses /api/admin/stats -> 200 OK
        const adminAccess = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.strictEqual(adminAccess.status, 200, "Admin must receive 200 OK");
        const adminData = await adminAccess.json();
        assert.strictEqual(adminData.success, true);
        assert.ok(adminData.platformStats.totalUsers >= 2);
    });

    // 5. Genuine Live Market Data Provider
    await t.test("5. Genuine Live Market Data Provider (Binance/CoinGecko)", async () => {
        const res = await fetch(`${baseUrl}/api/crypto/market`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.bitcoin, "Must contain live bitcoin data");
        assert.ok(typeof data.data.bitcoin.usd === "number", "BTC price must be a real number");
        assert.ok(data.data.bitcoin.usd > 1000, "BTC price must be legitimate live market value");
        assert.ok(data.source.includes("Binance") || data.source.includes("CoinGecko"), "Must come from genuine provider");
    });

    // 6. Genuine Live Crypto News Provider
    await t.test("6. Genuine Live Crypto News Feeds (CoinTelegraph, CoinDesk, Decrypt)", async () => {
        const res = await fetch(`${baseUrl}/api/crypto/news`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.articles), "Articles must be an array");
        assert.ok(data.articles.length > 0, "Must contain real fetched articles");
        const first = data.articles[0];
        assert.ok(first.title && first.url, "Articles must have title and url");
        assert.ok(first.source?.name, "Articles must have recognized source");
    });

    // 7. System Health Endpoint
    await t.test("7. Health Endpoint Reports All Subsystem States", async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(res.status, 200);
        const health = await res.json();
        assert.strictEqual(health.platform, "CryptoScope AI");
        assert.strictEqual(health.subsystems.database.status, "connected");
        assert.strictEqual(health.subsystems.realtime.status, "active");
        assert.strictEqual(health.subsystems.heuristicsEngine.rulesCount, 14);
    });

    // Cleanup
    await User.deleteMany({ _id: { $in: [userAId, userBId, adminId] } });
    await Wallet.deleteMany({ user: { $in: [userAId, userBId, adminId] } });
    await UserActivity.deleteMany({ userId: { $in: [userAId, userBId, adminId] } });

    server.close();
    setTimeout(() => process.exit(0), 500);
});
