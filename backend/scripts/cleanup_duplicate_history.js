/**
 * CryptoScope AI — One-Time Scan History Deduplication Cleanup Script
 * 
 * Groups existing Wallet scan records by (user, address), retains only the single
 * most recent document per group, and removes redundant duplicate scans.
 * Does NOT touch UserActivity audit logs.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Wallet = require("../models/walletModel");

async function runCleanup() {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/cryptoscope";
    console.log("Connecting to MongoDB for scan history cleanup...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    try {
        // Group all wallet scan docs by user and lowercased address
        const allWallets = await Wallet.find({}).sort({ scannedAt: -1, updatedAt: -1, createdAt: -1 });
        console.log(`Total wallet records before cleanup: ${allWallets.length}`);

        const seenKeys = new Set();
        const idsToKeep = [];
        const idsToDelete = [];

        for (const doc of allWallets) {
            const userKey = doc.user ? doc.user.toString() : "anonymous";
            const addrKey = (doc.address || "").toLowerCase().trim();
            const groupKey = `${userKey}::${addrKey}`;

            if (!seenKeys.has(groupKey)) {
                seenKeys.add(groupKey);
                idsToKeep.push(doc._id);
            } else {
                idsToDelete.push(doc._id);
            }
        }

        console.log(`Unique (user, address) groups identified: ${seenKeys.size}`);
        console.log(`Duplicate records marked for deletion: ${idsToDelete.length}`);

        if (idsToDelete.length > 0) {
            const deleteResult = await Wallet.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Successfully deleted ${deleteResult.deletedCount} duplicate history record(s).`);
        } else {
            console.log("No duplicate history records found in database (already clean).");
        }

        const remainingCount = await Wallet.countDocuments({});
        console.log(`Total wallet records remaining: ${remainingCount}`);

        return {
            initialCount: allWallets.length,
            uniqueGroups: seenKeys.size,
            deletedCount: idsToDelete.length,
            remainingCount,
        };
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB connection closed.");
    }
}

if (require.main === module) {
    runCleanup()
        .then((res) => {
            console.log("Cleanup script completed successfully:", res);
            process.exit(0);
        })
        .catch((err) => {
            console.error("Cleanup script failed:", err);
            process.exit(1);
        });
}

module.exports = runCleanup;
