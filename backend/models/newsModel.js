const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
    {
        fingerprint: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        source: {
            name: { type: String, default: "Crypto Intelligence Wire" },
            url: { type: String, default: null },
        },
        category: {
            type: String,
            enum: ["Security & Exploits", "Regulatory & OFAC", "Whale Activity", "Market Trends", "General"],
            default: "General",
            index: true,
        },
        severity: {
            type: String,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            default: "MEDIUM",
        },
        publishedAt: {
            type: Date,
            required: true,
        },
        imageUrl: {
            type: String,
            default: null,
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to automatically purge articles older than 7 days (prevents uncontrolled DB growth)
newsSchema.index({ publishedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
newsSchema.index({ category: 1, publishedAt: -1 });

module.exports = mongoose.model("CryptoNews", newsSchema);
