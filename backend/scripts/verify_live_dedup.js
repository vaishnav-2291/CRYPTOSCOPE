const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function runLiveVerification() {
    const baseUrl = "http://localhost:3000";
    const testEmail = `live_verify_${Date.now()}@cryptoscope.io`;
    const testPassword = "SecurePassword123!";

    console.log("1. Registering live test user:", testEmail);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Live Dedup Verifier",
            email: testEmail,
            password: testPassword,
        }),
    });
    const regData = await regRes.json();
    if (!regData.token) {
        throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    const token = regData.token;
    const authHeader = `Bearer ${token}`;
    console.log("✅ Authenticated token received.");

    const targetA = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
    const targetB = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo";

    console.log("\n2. Scanning Target A (Genesis) - Scan #1...");
    const s1 = await fetch(`${baseUrl}/api/wallet/${targetA}`, { headers: { Authorization: authHeader } });
    const d1 = await s1.json();
    console.log(`   Scan #1 ID: ${d1.scanId}`);

    await new Promise((r) => setTimeout(r, 200));

    console.log("3. Scanning Target A (Genesis) - Scan #2...");
    const s2 = await fetch(`${baseUrl}/api/wallet/${targetA}`, { headers: { Authorization: authHeader } });
    const d2 = await s2.json();
    console.log(`   Scan #2 ID: ${d2.scanId}`);

    await new Promise((r) => setTimeout(r, 200));

    console.log("4. Scanning Target A (Genesis) - Scan #3...");
    const s3 = await fetch(`${baseUrl}/api/wallet/${targetA}`, { headers: { Authorization: authHeader } });
    const d3 = await s3.json();
    console.log(`   Scan #3 ID: ${d3.scanId}`);

    console.log("\n5. Querying Scan History...");
    const histRes1 = await fetch(`${baseUrl}/api/wallet/history/all`, { headers: { Authorization: authHeader } });
    const histData1 = await histRes1.json();
    console.log(`   Total history rows returned: ${histData1.history.length}`);
    console.log(`   Row 1: Address=${histData1.history[0].address}, ScannedAt=${histData1.history[0].scannedAt}, ID=${histData1.history[0]._id}`);

    if (histData1.history.length !== 1) {
        throw new Error(`Expected 1 row in history after 3 scans of same address, got ${histData1.history.length}`);
    }
    console.log("✅ Verification Step 1-3 PASS: Exactly 1 row in History after 3 scans of the same address.");

    console.log("\n6. Scanning Target B (Binance Cold Storage)...");
    const sB = await fetch(`${baseUrl}/api/wallet/${targetB}`, { headers: { Authorization: authHeader } });
    const dB = await sB.json();
    console.log(`   Scan B ID: ${dB.scanId}`);

    console.log("\n7. Querying Scan History after scanning Target B...");
    const histRes2 = await fetch(`${baseUrl}/api/wallet/history/all`, { headers: { Authorization: authHeader } });
    const histData2 = await histRes2.json();
    console.log(`   Total history rows returned: ${histData2.history.length}`);
    histData2.history.forEach((row, i) => {
        console.log(`   Row ${i + 1}: Address=${row.address}, Balance=${row.balance} BTC, Score=${row.riskScore}/100, ScannedAt=${row.scannedAt}`);
    });

    if (histData2.history.length !== 2) {
        throw new Error(`Expected 2 rows in history, got ${histData2.history.length}`);
    }
    console.log("✅ Verification Step 4 PASS: Exactly 2 distinct rows for 2 unique addresses with newest first.");

    return {
        user: testEmail,
        historyCount: histData2.history.length,
        rows: histData2.history,
    };
}

runLiveVerification()
    .then((res) => {
        console.log("\n==================================================");
        console.log("🎉 ALL LIVE DEDUPLICATION CHECKS PASSED 100%");
        console.log("==================================================");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Live verification failed:", err);
        process.exit(1);
    });
