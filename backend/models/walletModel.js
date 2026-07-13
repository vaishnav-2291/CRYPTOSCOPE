const mongoose = require("mongoose");


const walletSchema = new mongoose.Schema({


    user: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: false

    },


    address: {

        type: String,

        required: true,

        unique: false

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


    // AI Risk Analysis Fields


    incomingTransactions: {

        type: Number,

        default: 0

    },


    outgoingTransactions: {

        type: Number,

        default: 0

    },


    transactionVolume: {

        type: Number,

        default: 0

    },


    walletAge: {

        type: Number,

        default: 0

    },


    riskFactors: {

        type: [String],

        default: []

    },


    aiReport: {

        type: String,

        default: ""

    },


    riskScore: {

        type: Number,

        default: 0

    },


    riskLevel: {

        type: String,

        default: "Unknown"

    },


    createdAt: {

        type: Date,

        default: Date.now

    }


});


module.exports = mongoose.model("Wallet", walletSchema);