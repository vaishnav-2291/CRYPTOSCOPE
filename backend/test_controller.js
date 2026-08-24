const { fetchWallet } = require("./controllers/walletController");

async function test() {
    const req = {
        params: { address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo" },
        validatedAddress: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
        user: null,
    };
    const res = {
        statusCode: 200,
        status(c) { this.statusCode = c; return this; },
        json(data) {
            console.log("RESPONSE JSON:", {
                statusCode: this.statusCode,
                success: data.success,
                riskScore: data.riskScore,
                riskLevel: data.riskLevel,
                balance: data.balance,
                error: data.error || data.message,
            });
        },
    };

    console.log("Calling fetchWallet directly...");
    await fetchWallet(req, res);
}

test();
