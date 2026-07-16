const express = require("express");
const router = express.Router();
const axios = require("axios");


// =====================================
// LIVE CRYPTO MARKET
// =====================================

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

        console.error("Market API Error:", err.message);

        res.status(500).json({

            success: false,

            error: "Failed to fetch crypto market"

        });

    }

});



// =====================================
// LIVE CRYPTO NEWS
// =====================================

router.get("/news", async (req, res) => {

    try {

        const response = await axios.get(

            "https://gnews.io/api/v4/search",

            {

                params: {

                    q: "cryptocurrency OR bitcoin OR ethereum",

                    lang: "en",

                    country: "us",

                    max: 10,

                    token: process.env.GNEWS_API_KEY

                }

            }

        );

        res.json({

            success: true,

            articles: response.data.articles

        });

    }

    catch (err) {

        console.error("GNews Error:", err.response?.data || err.message);

        res.status(500).json({

            success: false,

            error: "Failed to fetch crypto news"

        });

    }

});


module.exports = router;