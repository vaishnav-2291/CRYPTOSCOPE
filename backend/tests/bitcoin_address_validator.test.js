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

        try {
            const res = await fetch(`${baseUrl}/api/forensics/dusting/invalid_address_xyz_123`);
            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error, "INVALID_BITCOIN_ADDRESS");
            assert.ok(data.message);
        } finally {
            server.close();
            setTimeout(() => process.exit(0), 100);
        }
    });
});
