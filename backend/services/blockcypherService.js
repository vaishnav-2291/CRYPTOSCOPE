const axios = require("axios");


// =====================================
// GET WALLET DATA FROM MEMPOOL API
// =====================================

const getWalletData = async (address) => {

    try {

        if (!address) {

            throw new Error("Wallet address is required");

        }


        const walletAddress = address.trim();



        // ===============================
        // Wallet Summary
        // ===============================

        const walletResponse = await axios.get(
            `https://mempool.space/api/address/${walletAddress}`,
            {
                timeout: 10000
            }
        );


        const data = walletResponse.data;



        // ===============================
        // Transaction History
        // ===============================

        const txResponse = await axios.get(
            `https://mempool.space/api/address/${walletAddress}/txs`,
            {
                timeout: 10000
            }
        );



        const transactions = txResponse.data.map((tx) => {


            return {

                hash: tx.txid,


                status: tx.status.confirmed
                    ? "Confirmed"
                    : "Pending",


                amount:

                    (

                        tx.vout.reduce(

                            (sum, output) =>

                                sum + output.value,

                            0

                        )

                        / 100000000

                    ).toFixed(8)

            };


        });





        // ===============================
        // Convert Satoshi to BTC
        // ===============================


        const balance =

            (

                data.chain_stats.funded_txo_sum -

                data.chain_stats.spent_txo_sum

            ) / 100000000;



        const totalReceived =

            data.chain_stats.funded_txo_sum / 100000000;



        const totalSent =

            data.chain_stats.spent_txo_sum / 100000000;






        return {


            address: walletAddress,


            balance:


                Number(balance.toFixed(8)),



            total_received:


                Number(totalReceived.toFixed(8)),



            total_sent:


                Number(totalSent.toFixed(8)),



            n_tx:


                data.chain_stats.tx_count,



            transactions


        };



    }

    catch (error) {


        console.log("\n========== MEMPOOL API ERROR ==========");



        if (error.response) {


            console.log(

                "Status Code:",

                error.response.status

            );


            console.log(

                "Response:",

                error.response.data

            );



            if(error.response.status === 404){

                throw new Error(

                    "Wallet address not found"

                );

            }



        }


        else if(error.request){


            console.log(

                "No response from Mempool API"

            );


            throw new Error(

                "Blockchain API unavailable"

            );


        }


        else {


            console.log(

                "Message:",

                error.message

            );


            throw new Error(

                error.message

            );


        }


        throw new Error(

            "Failed to fetch wallet data"

        );


    }


};



module.exports = {

    getWalletData

};