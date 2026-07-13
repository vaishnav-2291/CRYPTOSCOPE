const express = require("express");
const cors = require("cors");


const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");


const app = express();


// ===============================
// Middleware
// ===============================

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);


app.use(express.json());



// ===============================
// API Routes
// ===============================


app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/crypto", cryptoRoutes);



// ===============================
// Health Check
// ===============================

app.get("/", (req,res)=>{

    res.json({

        success:true,

        message:"CryptoScope AI Backend Running 🚀"

    });

});



// ===============================

module.exports = app;