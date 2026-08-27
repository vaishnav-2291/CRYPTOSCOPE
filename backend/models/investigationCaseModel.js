const mongoose = require("mongoose");

const targetAddressSchema = new mongoose.Schema(
    {
        address: {
            type: String,
            required: true,
            trim: true,
        },
        customLabel: {
            type: String,
            trim: true,
            default: "Target Wallet",
        },
        analystNotes: {
            type: String,
            default: "",
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const timelineNoteSchema = new mongoose.Schema(
    {
        author: {
            type: String,
            default: "Analyst",
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["FINDING", "HYPOTHESIS", "EVIDENCE", "COMPLIANCE_ACTION"],
            default: "FINDING",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const investigationCaseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Investigation case title is required."],
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        status: {
            type: String,
            enum: ["OPEN", "IN_REVIEW", "RESOLVED", "ARCHIVED"],
            default: "OPEN",
            index: true,
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
            index: true,
        },
        caseTags: {
            type: [String],
            default: ["On-Chain Audit"],
        },
        addresses: {
            type: [targetAddressSchema],
            default: [],
        },
        timelineNotes: {
            type: [timelineNoteSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

investigationCaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("InvestigationCase", investigationCaseSchema);
