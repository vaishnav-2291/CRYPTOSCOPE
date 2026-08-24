const axios = require("axios");

async function test() {
    console.log("Testing Mempool.space fetch...");
    try {
        const start = Date.now();
        const res = await axios.get("https://mempool.space/api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", { timeout: 8000 });
        console.log(`Success in ${Date.now() - start}ms:`, res.status, res.data);
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

test();
