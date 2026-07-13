const axios = require("axios");

const getWalletData = async (address) => {

    try {

        // Wallet Summary
        const walletResponse = await axios.get(
            `https://mempool.space/api/address/${address}`
        );

        const data = walletResponse.data;

        // Transaction History
        const txResponse = await axios.get(
            `https://mempool.space/api/address/${address}/txs`
        );

        const transactions = txResponse.data.map((tx) => {

            return {

                hash: tx.txid,

                status: tx.status.confirmed
                    ? "Confirmed"
                    : "Pending",

                amount: (
                    tx.vout.reduce(
                        (sum, output) => sum + output.value,
                        0
                    ) / 100000000
                ).toFixed(8)

            };

        });

        return {

            address,

            balance:
                data.chain_stats.funded_txo_sum -
                data.chain_stats.spent_txo_sum,

            total_received:
                data.chain_stats.funded_txo_sum,

            total_sent:
                data.chain_stats.spent_txo_sum,

            n_tx:
                data.chain_stats.tx_count,

            transactions

        };

    }
    catch (error) {

        console.log("\n========== MEMPOOL API ERROR ==========");

        if (error.response) {

            console.log("Status Code :", error.response.status);
            console.log("Status Text :", error.response.statusText);
            console.log("Response :", error.response.data);

        } else if (error.request) {

            console.log("No Response From Server");
            console.log(error.request);

        } else {

            console.log("Message :", error.message);

        }

        console.log("=======================================\n");

        throw new Error("Failed to fetch wallet data");

    }

};

module.exports = {

    getWalletData

};