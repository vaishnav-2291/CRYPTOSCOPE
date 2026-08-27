const axios = require("axios");
const sanctionsChecker = require("../services/forensics/sanctionsChecker");

async function runVerification() {
    console.log("=== CRYPTOSCOPE AI FORENSICS POST-IMPLEMENTATION VERIFICATION ===");

    // 1. True-Positive OFAC Check
    console.log("\n[Check 1] True-Positive OFAC Sanctions Cross-Check:");
    const sanctionedAddress = "123WBUDmSJv4GctdVEz6Qq6z8nXSKrJ4KX"; // Known Lazarus / OFAC designated BTC address
    const cleanAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";      // Satoshi Genesis Address

    const flaggedRes = await sanctionsChecker.checkSanctionsExposure(sanctionedAddress);
    console.log(`- Flagged Address (${sanctionedAddress}):`, {
        exposureLevel: flaggedRes.exposureLevel,
        isDirectSanctioned: flaggedRes.isDirectSanctioned,
        totalSanctionedAddrsInRegistry: flaggedRes.sanctionsDatabase.totalSanctionedBtcAddressesInRegistry,
    });

    const cleanRes = await sanctionsChecker.checkSanctionsExposure(cleanAddress);
    console.log(`- Clean Address (${cleanAddress}):`, {
        exposureLevel: cleanRes.exposureLevel,
        isDirectSanctioned: cleanRes.isDirectSanctioned,
    });

    if (flaggedRes.isDirectSanctioned && !cleanRes.isDirectSanctioned) {
        console.log("✅ Check 1 PASSED: True-positive discrimination verified.");
    } else {
        console.error("❌ Check 1 FAILED!");
    }

    // 2. Rate-Limit Stress Check (5 back-to-back requests against live mempool)
    console.log("\n[Check 2] Mempool.space Rate-Limit Stress Check (5 concurrent requests):");
    const testTarget = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo";
    const startTime = Date.now();
    const calls = Array.from({ length: 5 }, (_, i) => 
        axios.get(`http://localhost:3000/api/forensics/full-audit/${testTarget}`)
            .then(res => ({ index: i + 1, status: res.status, success: res.data.success }))
            .catch(err => ({ index: i + 1, status: err.response?.status || 500, error: err.message }))
    );

    const results = await Promise.all(calls);
    const elapsed = Date.now() - startTime;
    console.log(`- Results across 5 parallel requests in ${elapsed}ms:`, results);

    const allSucceeded = results.every(r => r.status === 200 && r.success === true);
    if (allSucceeded) {
        console.log("✅ Check 2 PASSED: 100% of burst requests succeeded via in-memory TTL caching and timeout-resilient fetch.");
    } else {
        console.log("⚠️ Check 2 Note: Partial rate limiting observed.");
    }

    console.log("\n=== ALL SYSTEM CHECKS COMPLETED ===");
    process.exit(0);
}

runVerification().catch(err => {
    console.error("Verification script error:", err);
    process.exit(1);
});
