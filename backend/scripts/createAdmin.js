/**
 * Secure CLI Administrative Account Provisioning Utility
 *
 * Usage:
 *   node backend/scripts/createAdmin.js <email> <password> [name]
 *
 * Examples:
 *   node backend/scripts/createAdmin.js secops@cryptoscope.ai "StrongSecOpsPass2026!" "SecOps Administrator"
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const { logActivity } = require("../services/activityService");

async function provisionAdmin() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error("\n❌ Error: Missing required arguments.");
        console.log("Usage: node backend/scripts/createAdmin.js <email> <password> [name]\n");
        process.exit(1);
    }

    const email = args[0].toLowerCase().trim();
    const rawPassword = args[1];
    const name = args[2] ? args[2].trim() : "System Administrator";

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error("❌ Error: Invalid email address format.");
        process.exit(1);
    }

    // Validate password complexity
    if (rawPassword.length < 8) {
        console.error("❌ Error: Admin password must be at least 8 characters long.");
        process.exit(1);
    }

    try {
        await connectDB();

        let user = await User.findOne({ email });
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        if (user) {
            user.role = "admin";
            user.status = "active";
            user.password = hashedPassword;
            if (name) user.name = name;
            user.passwordChangedAt = new Date();
            user.refreshToken = null; // Invalidate any old sessions
            await user.save();

            console.log(`\n✅ Existing account '${email}' has been successfully upgraded to Administrator.`);
            console.log(`   User ID: ${user._id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}`);
        } else {
            user = new User({
                name,
                email,
                password: hashedPassword,
                role: "admin",
                status: "active",
                authProvider: "local",
            });
            await user.save();

            console.log(`\n✅ New Administrator account '${email}' successfully created and persisted in MongoDB.`);
            console.log(`   User ID: ${user._id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}`);
        }

        // Audit log
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "ADMIN_ACTION",
            resourceType: "USER",
            resourceId: user._id.toString(),
            details: { email: user.email, role: "admin", actionType: "PROVISION_ADMIN", method: "SERVER_CLI" },
            status: "SUCCESS",
        });

        console.log("   Audit entry recorded in MongoDB UserActivities collection.\n");
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Provisioning Error:", err.message);
        if (mongoose.connection) await mongoose.connection.close();
        process.exit(1);
    }
}

provisionAdmin();
