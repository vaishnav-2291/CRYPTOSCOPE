const Wallet = require("../models/walletModel");

exports.getDashboard = async (req, res) => {

    try {

        const wallets = await Wallet.find({

            user: req.user.id

        }).sort({

            createdAt: -1

        });

        const totalScans = wallets.length;

        const lowRisk = wallets.filter(
            w => w.riskLevel === "Low"
        ).length;

        const mediumRisk = wallets.filter(
            w => w.riskLevel === "Medium"
        ).length;

        const highRisk = wallets.filter(
            w => w.riskLevel === "High"
        ).length;

        res.render("dashboard", {

            wallets,

            totalScans,

            lowRisk,

            mediumRisk,

            highRisk

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).send("Dashboard Error");

    }

};