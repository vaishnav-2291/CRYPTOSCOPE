const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../app");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const UserActivity = require("../models/activityModel");
const SecurityAlert = require("../models/alertModel");

const JWT_SECRET = process.env.JWT_SECRET || "cryptoscope_secret_key_default_2026";

test("CRYPTOSCOPE Access-Control & Multi-User Isolation Verification Suite", async (t) => {
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

    const userAEmail = `user_a_${Date.now()}@cryptoscope.ai`;
    const userAPass = "UserAPassword@2026!";
    const userBEmail = `user_b_${Date.now()}@cryptoscope.ai`;
    const userBPass = "UserBPassword@2026!";
    const adminEmail = `admin_sec_${Date.now()}@cryptoscope.ai`;
    const adminPass = "AdminPassword@2026!";
    const googleEmail = `google_user_${Date.now()}@cryptoscope.ai`;

    let userADoc = null;
    let userBDoc = null;
    let adminDoc = null;
    let googleDoc = null;

    let userAToken = null;
    let userBToken = null;
    let adminToken = null;
    let googleToken = null;

    // Bootstrap Users
    await t.test("Bootstrap test accounts in MongoDB", async () => {
        const hashA = await bcrypt.hash(userAPass, 10);
        userADoc = await User.create({
            name: "User Alice",
            email: userAEmail,
            password: hashA,
            role: "user",
            status: "active",
        });

        const hashB = await bcrypt.hash(userBPass, 10);
        userBDoc = await User.create({
            name: "User Bob",
            email: userBEmail,
            password: hashB,
            role: "user",
            status: "active",
        });

        const hashAdmin = await bcrypt.hash(adminPass, 10);
        adminDoc = await User.create({
            name: "SecOps Admin",
            email: adminEmail,
            password: hashAdmin,
            role: "admin",
            status: "active",
        });

        googleDoc = await User.create({
            name: "Google Authenticated Alice",
            email: googleEmail,
            googleId: `goog_${Date.now()}`,
            role: "user",
            status: "active",
            authProvider: "google",
        });

        // Acquire tokens
        const resA = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userAEmail, password: userAPass }),
        });
        const dataA = await resA.json();
        userAToken = dataA.token;

        const resB = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userBEmail, password: userBPass }),
        });
        const dataB = await resB.json();
        userBToken = dataB.token;

        const resAdmin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminEmail, password: adminPass }),
        });
        const dataAdmin = await resAdmin.json();
        adminToken = dataAdmin.token;

        googleToken = jwt.sign(
            { id: googleDoc._id.toString(), email: googleDoc.email, role: googleDoc.role },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
    });

    // 1. Unauthenticated GET user history -> 401
    await t.test("1. Unauthenticated GET /api/wallet/history/all -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/history/all`);
        assert.strictEqual(res.status, 401);
    });

    // 2. Unauthenticated GET user activities -> 401
    await t.test("2. Unauthenticated GET /api/wallet/activities -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/activities`);
        assert.strictEqual(res.status, 401);
    });

    // 3. Unauthenticated GET watchlist -> 401
    await t.test("3. Unauthenticated GET /api/wallet/watchlist -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/watchlist`);
        assert.strictEqual(res.status, 401);
    });

    // 4. Unauthenticated GET user alerts -> 401
    await t.test("4. Unauthenticated GET /api/wallet/alerts -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/alerts`);
        assert.strictEqual(res.status, 401);
    });

    // 5. Unauthenticated wallet scan -> 401
    await t.test("5. Unauthenticated GET /api/wallet/:address -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`);
        assert.strictEqual(res.status, 401);
    });

    // 6. Unauthenticated wallet analysis/search (transactions/graph/trend/batch) -> 401
    await t.test("6. Unauthenticated sub-resource analysis/batch -> 401", async () => {
        const endpoints = [
            "/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/transactions",
            "/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/graph",
            "/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/trend",
        ];
        for (const ep of endpoints) {
            const res = await fetch(`${baseUrl}${ep}`);
            assert.strictEqual(res.status, 401, `Endpoint ${ep} must return 401 for unauthenticated client`);
        }

        const batchRes = await fetch(`${baseUrl}/api/wallet/batch-scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addresses: ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"] }),
        });
        assert.strictEqual(batchRes.status, 401, "Batch scan must return 401 for unauthenticated client");
    });

    // 7. Unauthenticated protected dashboard API -> 401
    await t.test("7. Unauthenticated GET /api/wallet/dashboard/stats -> 401", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/dashboard/stats`);
        assert.strictEqual(res.status, 401);
    });

    // 8. Authenticated User A can scan
    let userAScanId = null;
    await t.test("8. Authenticated User A can scan wallet -> 200 & persisted with user: UserA", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.scanId);
        userAScanId = data.scanId;

        // Verify in MongoDB that scan has user: userADoc._id
        const scanDoc = await Wallet.findById(userAScanId);
        assert.ok(scanDoc);
        assert.strictEqual(scanDoc.user.toString(), userADoc._id.toString());
    });

    // 9. Authenticated User A sees User A history
    await t.test("9. Authenticated User A sees User A history -> 200 & contains User A scan", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.history.some((h) => h._id.toString() === userAScanId));
    });

    // 10. User A cannot see User B history
    await t.test("10. User B cannot see User A scan history", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.count, 0, "User B must have 0 scans in history");
        assert.ok(!data.history.some((h) => h._id.toString() === userAScanId));
    });

    // 11. User B cannot see User A activity data or watchlist
    await t.test("11. User B cannot see User A activities or watchlist", async () => {
        // Add item to User A watchlist
        await fetch(`${baseUrl}/api/wallet/watchlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userAToken}`,
            },
            body: JSON.stringify({ address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", label: "User A Watchlist Target" }),
        });

        // User B queries watchlist
        const wRes = await fetch(`${baseUrl}/api/wallet/watchlist`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.strictEqual(wRes.status, 200);
        const wData = await wRes.json();
        assert.strictEqual(wData.watchlist.length, 0, "User B watchlist must be empty");

        // User B queries activities
        const actRes = await fetch(`${baseUrl}/api/wallet/activities`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.strictEqual(actRes.status, 200);
        const actData = await actRes.json();
        assert.ok(
            !actData.activities.some((a) => a.userId === userADoc._id.toString()),
            "User B activities must NOT contain User A events"
        );
    });

    // 12. Logout / token clearing -> protected API calls fail with 401
    await t.test("12. Expired / Invalidated / Missing token -> 401 Unauthorized", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: "Bearer invalid_or_cleared_token" },
        });
        assert.strictEqual(res.status, 401);
    });

    // 13. Normal user cannot access admin APIs -> 403
    await t.test("13. Normal user cannot access admin APIs -> 403 Forbidden", async () => {
        const endpoints = ["/api/admin/stats", "/api/admin/entities", "/api/admin/scans", "/api/admin/activities"];
        for (const ep of endpoints) {
            const res = await fetch(`${baseUrl}${ep}`, {
                headers: { Authorization: `Bearer ${userAToken}` },
            });
            assert.strictEqual(res.status, 403);
        }
    });

    // 14. Admin can access authorized admin APIs -> 200
    await t.test("14. Admin can access authorized admin APIs -> 200 OK", async () => {
        const res = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.platformStats);
    });

    // 15. Google-authenticated user receives standard user permissions
    await t.test("15. Google-authenticated user has standard user permissions", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/dashboard/stats`, {
            headers: { Authorization: `Bearer ${googleToken}` },
        });
        assert.strictEqual(res.status, 200);

        const adminTry = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${googleToken}` },
        });
        assert.strictEqual(adminTry.status, 403, "Google authenticated regular user must receive 403 for admin API");
    });

    // 16. Public Market Rates and News remain accessible anonymously
    await t.test("16. Public market rates & news remain accessible anonymously -> 200 OK", async () => {
        const marketRes = await fetch(`${baseUrl}/api/crypto/market`);
        assert.strictEqual(marketRes.status, 200);
        const marketData = await marketRes.json();
        assert.strictEqual(marketData.success, true);

        const newsRes = await fetch(`${baseUrl}/api/crypto/news`);
        assert.strictEqual(newsRes.status, 200);
        const newsData = await newsRes.json();
        assert.strictEqual(newsData.success, true);
    });

    // 17. Newly registered user has 0 scans and clean empty state
    await t.test("17. Newly registered user has 0 scans and clean empty state", async () => {
        const newEmail = `fresh_user_${Date.now()}@cryptoscope.ai`;
        const newPass = "FreshUserPass@2026!";
        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Fresh User", email: newEmail, password: newPass }),
        });
        assert.strictEqual(regRes.status, 201);
        const regData = await regRes.json();
        const freshToken = regData.token;

        const histRes = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: `Bearer ${freshToken}` },
        });
        const histData = await histRes.json();
        assert.strictEqual(histData.count, 0, "Fresh user must have 0 history items");
        assert.strictEqual(histData.history.length, 0);

        await User.deleteOne({ email: newEmail });
    });

    // Cleanup
    await User.deleteMany({ _id: { $in: [userADoc._id, userBDoc._id, adminDoc._id, googleDoc._id] } });
    await Wallet.deleteMany({ user: { $in: [userADoc._id, userBDoc._id, adminDoc._id, googleDoc._id] } });
    await UserActivity.deleteMany({ userId: { $in: [userADoc._id, userBDoc._id, adminDoc._id, googleDoc._id] } });
    await SecurityAlert.deleteMany({ userId: { $in: [userADoc._id, userBDoc._id, adminDoc._id, googleDoc._id] } });

    server.close();
    setTimeout(() => process.exit(0), 500);
});
