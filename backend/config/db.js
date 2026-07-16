const mongoose = require("mongoose");
const dns = require("dns");


// Force Google DNS for MongoDB Atlas SRV resolution
dns.setServers([
    "8.8.8.8",
    "8.8.4.4"
]);


const connectDB = async () => {

    try {

        console.log("Connecting to MongoDB...");


        await mongoose.connect(
            process.env.MONGO_URI,
            {
                serverSelectionTimeoutMS: 10000,
            }
        );


        console.log("✅ MongoDB Connected Successfully");


    } catch (err) {


        console.error(
            "❌ MongoDB Connection Failed:",
            err.message
        );


        process.exit(1);


    }

};


module.exports = connectDB;