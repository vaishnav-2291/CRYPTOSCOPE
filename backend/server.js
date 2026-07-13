require("dotenv").config();

const connectDB = require("./config/db");
const app = require("./app");


const PORT = process.env.PORT || 3000;


// Database Connection

connectDB()
    .then(() => {

        app.listen(PORT, () => {

            console.log(
                `🚀 Server is running on port ${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "❌ Database Connection Failed:",
            error.message
        );

        process.exit(1);

    });