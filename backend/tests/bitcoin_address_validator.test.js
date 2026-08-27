const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../app");
const { validateBitcoinAddressFormat } = require("../middleware/bitcoinAddressValidator");

test("CryptoScope AI Bitcoin Address Regex Validator Test Suite", async (t) => {
    // 1. Legacy P2PKH Addresses
    await t.test("1. Validates Legacy P2PKH addresses (1...)", () => {
        const res = validateBitcoinAddressFormat("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        assert.strictEqual(res.isValid, true);
        assert.strictEqual(res.type, "Legacy (P2PKH)");
        assert.strictEqual(res.network, "mainnet");
    });

    // 2. Pay-to-Script-Hash (P2SH)
    await t.test("2. Validates Pay-to-Script-Hash P2SH addresses (3...)", () => {
        const res = validateBitcoinAddressFormat("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        assert.strictEqual(res.isValid, true);
        assert.strictEqual(res.type, "Pay-to-Script-Hash (P2SH)");
        assert.strictEqual(res.network, "mainnet");
    });

    // 3. Native SegWit (Bech32)
    await t.test("3. Validates Native SegWit Bech32 addresses (bc1q...)", () => {
        const res = validateBitcoinAddressFormat("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h");
        assert.strictEqual(res.isValid, true);
        assert.strictEqual(res.type, "Native SegWit (Bech32)");
        assert.strictEqual(res.network, "mainnet");
    });

    // 4. Taproot (Bech32m)
    await t.test("4. Validates Taproot Bech32m addresses (bc1p...)", () => {
        const res = validateBitcoinAddressFormat("bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297");
        assert.strictEqual(res.isValid, true);
        assert.strictEqual(res.type, "Taproot (P2TR / Bech32m)");
        assert.strictEqual(res.network, "mainnet");
    });

    // 5. Testnet Addresses
    await t.test("5. Validates Testnet addresses (tb1... / 2... / m... / n...)", () => {
        const res = validateBitcoinAddressFormat("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx");
        assert.strictEqual(res.isValid, true);
        assert.strictEqual(res.type, "Testnet Address");
        assert.strictEqual(res.network, "testnet");
    });

    // 6. Invalid / Ethereum / Malformed Addresses
    await t.test("6. Correctly rejects non-Bitcoin, Ethereum, and malformed addresses", () => {
        // Ethereum address
        const ethRes = validateBitcoinAddressFormat("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
        assert.strictEqual(ethRes.isValid, false);
        assert.ok(ethRes.error);

        // Empty / whitespace
        const emptyRes = validateBitcoinAddressFormat("");
        assert.strictEqual(emptyRes.isValid, false);

        // Random string
        const randomRes = validateBitcoinAddressFormat("not_a_bitcoin_address_123");
        assert.strictEqual(randomRes.isValid, false);

        // Invalid length
        const shortRes = validateBitcoinAddressFormat("1Short");
        assert.strictEqual(shortRes.isValid, false);
    });

    // 7. Route Middleware Rejection (HTTP 400 on malformed address)
    await t.test("7. Route middleware rejects invalid address with HTTP 400 Bad Request", async () => {
        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, resolve));
        const port = server.address().port;
        const baseUrl = `http://localhost:${port}`;

        const res = await fetch(`${baseUrl}/api/forensics/dusting/invalid_address_xyz_123`);
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error, "INVALID_BITCOIN_ADDRESS");
        assert.ok(data.message);

        server.close();
    });

    // 8. Case & Watchlist Address Validation
    await t.test("8. Case and Watchlist address validation on POST and DELETE routes", async () => {
        const { requireValidBitcoinAddress } = require("../middleware/bitcoinAddressValidator");
        const jwt = require("jsonwebtoken");
        const mongoose = require("mongoose");
        const mockUserId = new mongoose.Types.ObjectId();
        const mockCaseId = new mongoose.Types.ObjectId();

        // 8a. Direct middleware unit verification for valid & invalid inputs
        let validNextCalled = false;
        const validReq = { params: { address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo" } };
        const validRes = { status: () => validRes, json: () => validRes };
        requireValidBitcoinAddress(validReq, validRes, () => { validNextCalled = true; });
        assert.strictEqual(validNextCalled, true);
        assert.strictEqual(validReq.validatedAddress, "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");

        let invalidNextCalled = false;
        let statusCode = 0;
        let responseJson = null;
        const invalidReq = { params: { address: "not-a-real-address" } };
        const invalidRes = {
            status: (code) => { statusCode = code; return invalidRes; },
            json: (data) => { responseJson = data; return invalidRes; },
        };
        requireValidBitcoinAddress(invalidReq, invalidRes, () => { invalidNextCalled = true; });
        assert.strictEqual(invalidNextCalled, false);
        assert.strictEqual(statusCode, 400);
        assert.strictEqual(responseJson.error, "INVALID_BITCOIN_ADDRESS");

        // 8b. HTTP integration assertions across express routers
        const token = jwt.sign({ id: mockUserId, email: "validator_test@cryptoscope.ai", role: "user" }, process.env.JWT_SECRET || "default_jwt_secret_for_cryptoscope_ai_2026", { expiresIn: "1h" });
        const authHeader = `Bearer ${token}`;

        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, resolve));
        const port = server.address().port;
        const baseUrl = `http://localhost:${port}`;

        try {
            // A) POST /api/cases/:id/addresses with invalid address -> 400 Bad Request
            const postBadRes = await fetch(`${baseUrl}/api/cases/${mockCaseId}/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: authHeader },
                body: JSON.stringify({ address: "not-a-real-address", customLabel: "Bad" }),
            });
            assert.strictEqual(postBadRes.status, 400);
            const postBadData = await postBadRes.json();
            assert.strictEqual(postBadData.success, false);
            assert.strictEqual(postBadData.error, "INVALID_BITCOIN_ADDRESS");

            // B) POST /api/cases/:id/addresses with empty/missing address -> 400 Bad Request
            const postEmptyRes = await fetch(`${baseUrl}/api/cases/${mockCaseId}/addresses`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: authHeader },
                body: JSON.stringify({ customLabel: "No Address" }),
            });
            assert.strictEqual(postEmptyRes.status, 400);

            // C) DELETE /api/cases/:id/addresses/:address with invalid address -> 400 Bad Request
            const delBadCaseRes = await fetch(`${baseUrl}/api/cases/${mockCaseId}/addresses/invalid_addr_123`, {
                method: "DELETE",
                headers: { Authorization: authHeader },
            });
            assert.strictEqual(delBadCaseRes.status, 400);
            const delBadCaseData = await delBadCaseRes.json();
            assert.strictEqual(delBadCaseData.success, false);
            assert.strictEqual(delBadCaseData.error, "INVALID_BITCOIN_ADDRESS");

            // D) DELETE /api/wallet/watchlist/:address with invalid address -> 400 Bad Request
            const delBadWatchRes = await fetch(`${baseUrl}/api/wallet/watchlist/not-a-real-btc-address`, {
                method: "DELETE",
                headers: { Authorization: authHeader },
            });
            assert.strictEqual(delBadWatchRes.status, 400);
            const delBadWatchData = await delBadWatchRes.json();
            assert.strictEqual(delBadWatchData.success, false);
            assert.strictEqual(delBadWatchData.error, "INVALID_BITCOIN_ADDRESS");
        } finally {
            server.close();
            setTimeout(() => process.exit(0), 100);
        }
    });
});
