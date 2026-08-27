const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = require("../app");
const connectDB = require("../config/db");
const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

test("CryptoScope AI — Scan History Deduplication & Upsert Suite", async (t) => {
    let server;
    let baseUrl;
    let testUser;
    let authHeader;

    await connectDB();

    const testEmail = `dedup_tester_${Date.now()}@cryptoscope.ai`;
    testUser = await User.create({
        name: "Dedup Tester",
        email: testEmail,
        password: "HashedPassword123!",
        role: "user",
    });

    const token = jwt.sign(
        { id: testUser._id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || "default_jwt_secret_for_cryptoscope_ai_2026",
        { expiresIn: "1h" }
    );
    authHeader = `Bearer ${token}`;

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    const targetAddressA = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Genesis
    const targetAddressB = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"; // Binance Cold

    // 1. First scan of target Address A
    await t.test("1. First scan of Address A creates 1 history record", async () => {
        const res = await fetch(`${baseUrl}/api/wallet/${targetAddressA}`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);

        const historyDocs = await Wallet.find({ user: testUser._id, address: targetAddressA });
        assert.strictEqual(historyDocs.length, 1, "Must have exactly 1 record after first scan");
    });

    // 2. Rescanning Address A 3 times updates the same document in place
    await t.test("2. Rescanning Address A multiple times updates the existing record in-place", async () => {
        const beforeDocs = await Wallet.find({ user: testUser._id, address: targetAddressA });
        assert.strictEqual(beforeDocs.length, 1);
        const initialScanId = beforeDocs[0]._id.toString();
        const initialScannedAt = new Date(beforeDocs[0].scannedAt).getTime();

        // Delay 50ms so timestamp strictly increases
        await new Promise((r) => setTimeout(r, 50));

        // Scan 2
        const res2 = await fetch(`${baseUrl}/api/wallet/${targetAddressA}`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(res2.status, 200);

        // Scan 3
        const res3 = await fetch(`${baseUrl}/api/wallet/${targetAddressA}`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(res3.status, 200);

        const afterDocs = await Wallet.find({ user: testUser._id, address: targetAddressA });
        assert.strictEqual(afterDocs.length, 1, "Must STILL have exactly 1 record after 3 scans of the same address");
        assert.strictEqual(afterDocs[0]._id.toString(), initialScanId, "Document ID must remain the same (upserted in place)");
        assert.ok(
            new Date(afterDocs[0].scannedAt).getTime() >= initialScannedAt,
            "scannedAt timestamp must be updated to recent scan time"
        );
    });

    // 3. Scanning a DIFFERENT address creates a 2nd separate record
    await t.test("3. Scanning a new Address B creates a second distinct row", async () => {
        const resB = await fetch(`${baseUrl}/api/wallet/${targetAddressB}`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(resB.status, 200);

        const allUserScans = await Wallet.find({ user: testUser._id });
        assert.strictEqual(allUserScans.length, 2, "Must have exactly 2 distinct rows for 2 unique addresses");

        const addresses = allUserScans.map((d) => d.address);
        assert.ok(addresses.includes(targetAddressA));
        assert.ok(addresses.includes(targetAddressB));
    });

    // 4. GET /api/wallet/history/all returns deduplicated list sorted by most recent scannedAt
    await t.test("4. GET /api/wallet/history/all returns 1 row per unique address with newest first", async () => {
        const histRes = await fetch(`${baseUrl}/api/wallet/history/all`, {
            headers: { Authorization: authHeader },
        });
        assert.strictEqual(histRes.status, 200);
        const histData = await histRes.json();
        assert.strictEqual(histData.success, true);
        assert.strictEqual(histData.history.length, 2);

        // The most recently scanned address (Address B) should be first
        assert.strictEqual(histData.history[0].address, targetAddressB);
        assert.strictEqual(histData.history[1].address, targetAddressA);
    });

    // Cleanup
    await Wallet.deleteMany({ user: testUser._id });
    await User.deleteOne({ _id: testUser._id });
    await new Promise((resolve) => server.close(resolve));
});
