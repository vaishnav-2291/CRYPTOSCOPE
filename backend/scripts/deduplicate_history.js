/**
 * CryptoScope AI — Database Migration / Cleanup Script
 * Deduplicate Scan History: Keeps only the most recent scan per (user, address) pair.
 * 
 * Scoped strictly to the 'wallets' (Scan History) collection.
 * Does NOT touch Watchlist, Cases, Alerts, Users, or immutable Activity Logs.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Wallet = require("../models/walletModel");

async function deduplicateScanHistory() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("❌ MONGO_URI is missing in .env");
        process.exit(1);
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log("✅ Connected to MongoDB Atlas.");

    console.log("Auditing 'wallets' collection for duplicate scan records...");
    const allWallets = await Wallet.find({}).sort({ scannedAt: -1, updatedAt: -1, createdAt: -1 });
    console.log(`Found ${allWallets.length} total wallet scan documents in database.`);

    // Group by user ID + normalized address
    const groups = new Map();

    for (const doc of allWallets) {
        const userId = doc.user ? doc.user.toString() : "anonymous";
        const normalizedAddr = (doc.address || "").trim().toLowerCase();
        const key = `${userId}:${normalizedAddr}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(doc);
    }

    const idsToDelete = [];
    let duplicateGroupsCount = 0;

    for (const [key, docs] of groups.entries()) {
        if (docs.length > 1) {
            duplicateGroupsCount++;
            // Sort to ensure the most recent document is first
            docs.sort((a, b) => {
                const timeA = new Date(a.scannedAt || a.updatedAt || a.createdAt || 0).getTime();
                const timeB = new Date(b.scannedAt || b.updatedAt || b.createdAt || 0).getTime();
                return timeB - timeA;
            });

            const keepDoc = docs[0];
            const toRemove = docs.slice(1);
            console.log(` Group [${key}]: Keeping latest scan (${keepDoc._id}, scannedAt: ${keepDoc.scannedAt || keepDoc.createdAt}), removing ${toRemove.length} duplicates.`);
            toRemove.forEach((d) => idsToDelete.push(d._id));
        }
    }

    if (idsToDelete.length > 0) {
        const deleteResult = await Wallet.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`\n======================================================`);
        console.log(`✅ CLEANUP SUCCESSFUL`);
        console.log(`• Total documents examined: ${allWallets.length}`);
        console.log(`• Unique (user, address) groups: ${groups.size}`);
        console.log(`• Duplicate groups found: ${duplicateGroupsCount}`);
        console.log(`• Duplicate rows removed: ${deleteResult.deletedCount}`);
        console.log(`• Remaining unique history records: ${allWallets.length - deleteResult.deletedCount}`);
        console.log(`======================================================\n`);
    } else {
        console.log(`\n✅ No duplicate scan documents found. History is already clean.`);
    }

    await mongoose.connection.close();
    console.log("Database connection closed.");
    return {
        totalScanned: allWallets.length,
        uniqueGroups: groups.size,
        duplicatesRemoved: idsToDelete.length,
    };
}

if (require.main === module) {
    deduplicateScanHistory()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Cleanup error:", err);
            process.exit(1);
        });
}

module.exports = { deduplicateScanHistory };
