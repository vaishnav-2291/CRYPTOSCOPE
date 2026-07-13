const express = require("express");

const router = express.Router();

const axios = require("axios");

router.get("/market", async (req, res) => {

    try {

        const response = await axios.get(

            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true"

        );

        res.json({

            success: true,

            data: response.data

        });

    }

    catch (err) {

        console.error(err.message);

        res.status(500).json({

            success: false,

            error: "Failed to fetch crypto market"

        });

    }

});

module.exports = router;