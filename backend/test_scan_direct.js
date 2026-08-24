const { getWalletData } = require("./services/blockchainService");
const { calculateRisk } = require("./services/riskEngine");

async function test() {
    console.log("Starting direct wallet test...");
    const t0 = Date.now();
    try {
        const data = await getWalletData("34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
        const t1 = Date.now();
        console.log(`getWalletData finished in ${t1 - t0}ms:`, {
            address: data.address,
            balance: data.balance,
            txs: data.transactions.length,
            entity: data.entityTag?.name,
        });

        const risk = calculateRisk(data);
        console.log("calculateRisk:", {
            score: risk.riskScore,
            level: risk.riskLevel,
            rules: risk.ruleTriggers.length,
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
