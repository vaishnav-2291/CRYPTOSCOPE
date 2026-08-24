const axios = require("axios");

async function testAll() {
    const apis = [
        "https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=5",
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        "https://api.blockcypher.com/v1/btc/main",
    ];

    for (const url of apis) {
        console.log(`Testing ${url}...`);
        try {
            const start = Date.now();
            const res = await axios.get(url, { timeout: 4000 });
            console.log(`  -> SUCCESS in ${Date.now() - start}ms:`, res.status);
        } catch (err) {
            console.log(`  -> FAILED:`, err.message);
        }
    }
}

testAll();
