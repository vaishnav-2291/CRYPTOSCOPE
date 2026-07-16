const mongoose = require("mongoose");


const walletSchema = new mongoose.Schema({


    user: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: false

    },


    address: {

        type: String,

        required: true

    },


    balance: {

        type: Number,

        default: 0

    },


    totalReceived: {

        type: Number,

        default: 0

    },


    totalSent: {

        type: Number,

        default: 0

    },


    transactions: {

        type: Number,

        default: 0

    },



    // ===============================
    // Risk Analysis Data
    // ===============================


    riskScore: {

        type: Number,

        default: 0

    },


    riskLevel: {

        type: String,

        default: "Unknown"

    },


    riskFactors: {

        type: [String],

        default: []

    },


    aiReport: {

        type: String,

        default: ""

    },


    // ===============================
    // Risk Score Breakdown
    // ===============================


    scoreBreakdown: {

        transactionRisk: {

            type: Number,

            default: 0

        },


        balanceRisk: {

            type: Number,

            default: 0

        },


        transactionPatternRisk: {

            type: Number,

            default: 0

        },


        activityRisk: {

            type: Number,

            default: 0

        }

    },



    createdAt: {

        type: Date,

        default: Date.now

    }


});



module.exports = mongoose.model(
    "Wallet",
    walletSchema
);