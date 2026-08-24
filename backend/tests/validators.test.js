const test = require("node:test");
const assert = require("node:assert");
const { validateBitcoinAddress } = require("../middleware/validators");

test("Bitcoin Address Validator - Legacy (P2PKH)", () => {
    // Satoshi Nakamoto Genesis address
    const satoshi = validateBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
    assert.strictEqual(satoshi.isValid, true);
    assert.strictEqual(satoshi.type, "Legacy (P2PKH)");

    // Another legacy address
    const legacy = validateBitcoinAddress("1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ");
    assert.strictEqual(legacy.isValid, true);
    assert.strictEqual(legacy.type, "Legacy (P2PKH)");
});

test("Bitcoin Address Validator - Pay-to-Script-Hash (P2SH)", () => {
    // Binance Cold Storage address
    const binance = validateBitcoinAddress("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
    assert.strictEqual(binance.isValid, true);
    assert.strictEqual(binance.type, "Pay-to-Script-Hash (P2SH)");
});

test("Bitcoin Address Validator - Native SegWit (Bech32)", () => {
    const segwit = validateBitcoinAddress("bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h");
    assert.strictEqual(segwit.isValid, true);
    assert.strictEqual(segwit.type, "Native SegWit (Bech32)");
});

test("Bitcoin Address Validator - Taproot (Bech32m)", () => {
    const taproot = validateBitcoinAddress("bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0");
    assert.strictEqual(taproot.isValid, true);
    assert.strictEqual(taproot.type, "Taproot (P2TR / Bech32m)");
});

test("Bitcoin Address Validator - Invalid Addresses", () => {
    assert.strictEqual(validateBitcoinAddress("").isValid, false);
    assert.strictEqual(validateBitcoinAddress("123invalidaddress").isValid, false);
    assert.strictEqual(validateBitcoinAddress("0x71C8fb866E52e3560E33a466D5728a38F6c9B4b0").isValid, false); // Ethereum
    assert.strictEqual(validateBitcoinAddress("1InvalidChar0OI").isValid, false);
});
